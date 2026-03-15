class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };

    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach(el => delete queryObj[el]);

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  search() {
    if (this.queryString.search) {
      const { search } = this.queryString;

      // Specify the fields to search on
      const stringFields = ['name', 'number', 'email', 'title'];
      const numberFields = ['documentNumber'];

      // Escape special regex characters to prevent ReDoS attacks
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchPattern = new RegExp(escapedSearch, 'i');

      // Combine string and number field conditions
      const stringConditions = stringFields.map(field => ({
        [field]: searchPattern
      }));

      const numberConditions = Number.isFinite(Number(search))
        ? numberFields.map(field => ({
            [field]: parseInt(search, 10)
          }))
        : [];

      this.query = this.query.find({
        $or: [...stringConditions, ...numberConditions]
      });
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const MAX_LIMIT = 100;
    const page = this.queryString.page * 1 || 1;
    const limit = Math.min(
      Math.max(this.queryString.limit * 1 || 10, 1),
      MAX_LIMIT
    );
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
