const bcrypt = require('bcryptjs');
const roleRepository = require('../repositories/role.repository');
const userRepository = require('../repositories/user.repository');

class SeedService {
  async initializeRoles() {
    try {
      const roles = ['customer', 'staff', 'admin'];
      const descriptions = {
        customer: 'Khách hàng bình thường',
        staff: 'Nhân viên',
        admin: 'Quản trị viên'
      };

      for (const roleName of roles) {
        const existingRole = await roleRepository.findRoleByName(roleName);
        if (!existingRole) {
          await roleRepository.createRole({
            name: roleName,
            description: descriptions[roleName]
          });
        }
      }
    } catch (error) {
      console.error('Error initializing roles:', error.message);
      throw error;
    }
  }

  async initializeAdminAccount() {
    try {
      const existingAdmin = await userRepository.findUserByEmail(process.env.ADMIN_EMAIL);
      
      if (!existingAdmin) {
        const adminRole = await roleRepository.findRoleByName('admin');
        
        if (!adminRole) {
          throw new Error('Admin role not found. Please initialize roles first.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

        const adminUser = {
          fullname: process.env.ADMIN_FULLNAME,
          email: process.env.ADMIN_EMAIL,
          password: hashedPassword,
          phone: process.env.ADMIN_PHONE,
          address: process.env.ADMIN_ADDRESS,
          position: process.env.ADMIN_POSITION,
          role: adminRole._id,
          isVerified: true
        };

        await userRepository.createUser(adminUser);
      }
    } catch (error) {
      console.error('Error initializing admin account:', error.message);
      throw error;
    }
  }

  async seed() {
    try {
      await this.initializeRoles();
      await this.initializeAdminAccount();
    } catch (error) {
      console.error('Seeding failed:', error.message);
      throw error;
    }
  }
}

module.exports = new SeedService();
