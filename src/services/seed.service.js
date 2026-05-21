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
          console.log(`✓ Role '${roleName}' created successfully`);
        }
      }
    } catch (error) {
      console.error('Error initializing roles:', error.message);
      throw error;
    }
  }

  async initializeAdminAccount() {
    try {
      const adminEmail = 'admin';
      const existingAdmin = await userRepository.findUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        const adminRole = await roleRepository.findRoleByName('admin');
        
        if (!adminRole) {
          throw new Error('Admin role not found. Please initialize roles first.');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin', salt);

        const adminUser = {
          fullname: 'Admin System',
          email: adminEmail,
          password: hashedPassword,
          phone: '0000000001',
          address: 'System',
          position: 'Administrator',
          role: adminRole._id,
          active: true
        };

        await userRepository.createUser(adminUser);
        console.log('✓ Admin account created successfully');
        console.log(`  Email: ${adminEmail}`);
        console.log(`  Password: admin`);
      }
    } catch (error) {
      console.error('Error initializing admin account:', error.message);
      throw error;
    }
  }

  async seed() {
    try {
      console.log('\n=== Starting Database Seeding ===');
      await this.initializeRoles();
      await this.initializeAdminAccount();
      console.log('=== Seeding Completed ===\n');
    } catch (error) {
      console.error('Seeding failed:', error.message);
      throw error;
    }
  }
}

module.exports = new SeedService();
