export default class baseRepository {
  constructor(model) {
    this.model = model;
  }

  async baseGetById(id, populateBy) {
    try {
      let query = this.model.findById(id);

      if (populateBy) {
        if (Array.isArray(populateBy)) {
          populateBy.forEach((field) => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(populateBy);
        }
      }

      const document = await query.exec();

      if (!document) {
        throw new Error("Element was not found in the database");
      }

      return document;
    } catch (error) {
      throw error;
    }
  }

  async baseGetAll(options) {
    try {
      let query = this.model.find();

      if (options.sortBy) {
        const sortOrder = options.sortOrder === "desc" ? -1 : 1;
        query = query.sort({ [options.sortBy]: sortOrder });
      }

      if (options.populateBy) {
        if (Array.isArray(options.populateBy)) {
          options.populateBy.forEach((field) => {
            query = query.populate(field);
          });
        } else {
          query = query.populate(options.populateBy);
        }
      }
      const documents = await query.exec();
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async baseCreate(data, uniqueField) {
    try {
      //Dynamic filter
      const filter = {};
      filter[uniqueField] = data[uniqueField];

      //Search in database based on dynamic filter options
      const documentExists = await this.model.findOne(filter);
      if (documentExists) {
        throw new Error("Element already exists in database");
      }
      const document = await this.model.create(data);
      return document;
    } catch (error) {
      throw error;
    }
  }

  async baseUpdateById(id, data) {
    try {
      const document = await this.model.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  }

  async baseDeleteById(id) {
    try {
      const document = await this.model.findOneAndDelete({ _id: id });
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  }
}
