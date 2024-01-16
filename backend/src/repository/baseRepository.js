export default class baseRepository {
  constructor(model) {
    this.model = model;
  }

  async baseGetById(id) {
    try {
      const document = await this.model.findById(id);
      if (!document) {
        throw new Error("Element was not found in the database");
      }
      return document;
    } catch (error) {
      throw error;
    }
  }

  async baseGetAll() {
    try {
      const documents = await this.model.find();
      return documents;
    } catch (error) {
      throw error;
    }
  }

  async baseCreate(data) {
    try {
      const documentExists = await this.model.findOne({ email: data.email });
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
