const catchAsync = require('../utils/catchAsync');

exports.createOne = catchAsync(async (req, res, next) => {
  try {
    const { Octokit } = await import('@octokit/core'); // Dynamic import
    const fetch = (await import('node-fetch')).default; // Dynamic import for node-fetch

    const token = process.env.BUILD_TOKEN; // Store token securely in environment variables
    const owner = 'beingmomen'; // GitHub user/organization name
    const repo = 'elshatory'; // Repository name
    let job_id = null; // This will store the workflow run ID
    let workflow_id = null; // This will store the workflow ID

    // Create an instance of Octokit
    const octokit = new Octokit({
      auth: token,
      request: { fetch } // Pass fetch to Octokit
    });

    // Fetch the list of workflow runs for the repository
    const runsResponse = await octokit.request(
      `GET /repos/${owner}/${repo}/actions/runs`,
      {
        owner,
        repo
      }
    );

    // console.log(
    //   'runsResponse.data.workflow_runs :>> ',
    //   runsResponse.data.workflow_runs
    // );

    // Get the most recent workflow run's ID
    job_id = runsResponse.data.workflow_runs[0].id;
    workflow_id = runsResponse.data.workflow_runs[0].workflow_id;

    // Rerun the workflow using the job_id
    const response = await octokit.request(
      `POST /repos/${owner}/${repo}/actions/runs/${job_id}/rerun`,
      {
        owner,
        repo,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }
    );

    // console.log('Workflow rerun response:', response);

    // Send success response
    res.status(200).json({
      status: 'success',
      message: 'Build successfully restarted!'
      // workflows: runsResponse.data.workflow_runs
    });
  } catch (error) {
    console.error('Error restarting job:', error.message);

    res.status(500).json({
      status: 'fail',
      message: error.message || 'An error occurred while restarting the job.'
    });
  }
});
