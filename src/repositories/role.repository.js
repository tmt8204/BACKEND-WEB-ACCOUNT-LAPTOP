const Role = require('../models/role.model');

class RoleRepository {
  async createRole(roleData) {
    try {
      const role = new Role(roleData);
      const savedRole = await role.save();
      return savedRole;
    } catch (error) {
      throw error;
    }
  }

  async findRoleByName(name) {
    try {
      const role = await Role.findOne({ name: name.toLowerCase() });
      return role;
    } catch (error) {
      throw error;
    }
  }

  async findRoleById(id) {
    try {
      const role = await Role.findById(id);
      return role;
    } catch (error) {
      throw error;
    }
  }

  async findAllRoles() {
    try {
      const roles = await Role.find();
      return roles;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RoleRepository();
