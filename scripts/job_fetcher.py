#!/usr/bin/env python3
"""Job fetcher: uses python-jobspy for LinkedIn.

Usage:
    python3 job_fetcher.py --terms "Frontend Developer,Vue" \
        --location "Egypt" --sites linkedin \
        --results-per-site 30 --hours-old 168

Output: JSON to stdout with shape:
    {
      "status": "ok" | "partial" | "failed",
      "sources": {
        "linkedin": {"jobs": [...], "error": null, "degraded": false}
      }
    }
"""

from __future__ import annotations

import argparse
import json
import math
import sys
import traceback
from typing import Any, Dict, List


DEFAULT_RESULTS_PER_SITE = 30
DEFAULT_HOURS_OLD = 168  # 7 days


def _is_nan(value: Any) -> bool:
    try:
        return isinstance(value, float) and math.isnan(value)
    except Exception:
        return False


def _clean(value: Any, default: str = '') -> Any:
    if value is None or _is_nan(value):
        return default
    return value


def _as_str(value: Any) -> str:
    if value is None or _is_nan(value):
        return ''
    try:
        if hasattr(value, 'isoformat'):
            return value.isoformat()
    except Exception:
        pass
    return str(value)


def _normalize_job(row: Dict[str, Any], site: str) -> Dict[str, Any]:
    title = _clean(row.get('title'))
    company = _clean(row.get('company'))
    location = _clean(row.get('location'))
    description = _clean(row.get('description'))
    job_url = _clean(row.get('job_url')) or _clean(row.get('job_url_direct'))
    date_posted = row.get('date_posted') if not _is_nan(row.get('date_posted')) else None
    job_type = _clean(row.get('job_type'))
    is_remote = row.get('is_remote') if not _is_nan(row.get('is_remote')) else None
    min_amount = row.get('min_amount') if not _is_nan(row.get('min_amount')) else None
    max_amount = row.get('max_amount') if not _is_nan(row.get('max_amount')) else None
    currency = _clean(row.get('currency'))

    salary = ''
    if min_amount or max_amount:
        parts = []
        if min_amount:
            parts.append(str(int(min_amount)))
        if max_amount:
            parts.append(str(int(max_amount)))
        salary = ' - '.join(parts)
        if currency:
            salary = f"{salary} {currency}"

    workplace = ''
    if is_remote is True:
        workplace = 'remote'
    elif is_remote is False:
        workplace = 'onsite'

    ext_id = _clean(row.get('id')) or _clean(row.get('job_id'))

    return {
        'title': title.strip() if isinstance(title, str) else str(title),
        'company': company.strip() if isinstance(company, str) else str(company),
        'location': location.strip() if isinstance(location, str) else str(location),
        'description': description if isinstance(description, str) else str(description),
        'jobUrl': job_url if isinstance(job_url, str) else str(job_url),
        'source': site,
        'seniority': '',
        'workplace': workplace,
        'salary': salary,
        'postedAt': _as_str(date_posted),
        'jobType': job_type if isinstance(job_type, str) else str(job_type),
        'externalId': ext_id if isinstance(ext_id, str) else str(ext_id)
    }


def _scrape_site(
    site: str,
    terms: List[str],
    location: str,
    results_per_site: int,
    hours_old: int
) -> Dict[str, Any]:
    try:
        from jobspy import scrape_jobs
    except ImportError as exc:
        return {
            'jobs': [],
            'error': f'python-jobspy not installed: {exc}',
            'degraded': True
        }

    aggregated: List[Dict[str, Any]] = []
    last_error: str = ''

    for term in terms:
        try:
            df = scrape_jobs(
                site_name=[site],
                search_term=term,
                location=location or None,
                results_wanted=results_per_site,
                hours_old=hours_old,
                linkedin_fetch_description=site == 'linkedin',
                verbose=0
            )
            if df is None or df.empty:
                continue
            for _, row in df.iterrows():
                aggregated.append(_normalize_job(row.to_dict(), site))
        except Exception as exc:  # noqa: BLE001
            last_error = f'{type(exc).__name__}: {exc}'
            continue

    # Dedupe by jobUrl within this site
    seen = set()
    deduped: List[Dict[str, Any]] = []
    for job in aggregated:
        url = job.get('jobUrl')
        if not url or url in seen:
            continue
        seen.add(url)
        deduped.append(job)

    return {
        'jobs': deduped,
        'error': last_error if not deduped and last_error else None,
        'degraded': bool(last_error and not deduped)
    }


def main() -> int:
    parser = argparse.ArgumentParser(description='Fetch jobs via JobSpy')
    parser.add_argument('--terms', required=True, help='Comma-separated search terms')
    parser.add_argument('--location', default='', help='Location (e.g. Egypt)')
    parser.add_argument(
        '--sites', default='linkedin',
        help='Comma-separated sites: linkedin,glassdoor,zip_recruiter'
    )
    parser.add_argument(
        '--results-per-site', type=int, default=DEFAULT_RESULTS_PER_SITE,
        help='Results per term per site'
    )
    parser.add_argument(
        '--hours-old', type=int, default=DEFAULT_HOURS_OLD,
        help='Only jobs posted in the last N hours'
    )

    args = parser.parse_args()

    terms = [t.strip() for t in args.terms.split(',') if t.strip()]
    sites = [s.strip() for s in args.sites.split(',') if s.strip()]

    if not terms:
        print(json.dumps({
            'status': 'failed',
            'error': 'no search terms provided',
            'sources': {}
        }))
        return 1

    sources: Dict[str, Dict[str, Any]] = {}
    any_ok = False
    any_fail = False

    for site in sites:
        try:
            result = _scrape_site(
                site=site,
                terms=terms,
                location=args.location,
                results_per_site=args.results_per_site,
                hours_old=args.hours_old
            )
        except Exception as exc:  # noqa: BLE001
            result = {
                'jobs': [],
                'error': f'{type(exc).__name__}: {exc}',
                'degraded': True
            }

        if result['jobs']:
            any_ok = True
        else:
            any_fail = True

        sources[site] = result

    if any_ok and any_fail:
        status = 'partial'
    elif any_ok:
        status = 'ok'
    else:
        status = 'failed'

    print(json.dumps({
        'status': status,
        'sources': sources
    }, ensure_ascii=False, default=str))

    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except Exception:  # noqa: BLE001
        print(json.dumps({
            'status': 'failed',
            'error': traceback.format_exc(),
            'sources': {}
        }))
        sys.exit(1)
