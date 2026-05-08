import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(emp_id: string, pass: string): Promise<any> {
    const user = await this.prisma.employees.findUnique({ where: { emp_id } });
    if (user) {
      // If user has a hashed password, compare it
      if (user.password) {
        const isMatch = await bcrypt.compare(pass, user.password);
        if (isMatch) {
          const { password, ...result } = user;
          return result;
        }
      } else {
        // Migration fallback: if no password set, allow 'password123'
        if (pass === 'password123') {
          const { password, ...result } = user;
          return result;
        }
      }
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.name, sub: user.emp_id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        emp_id: user.emp_id,
        name: user.name,
        role: user.role,
        branch_id: user.branch_id,
      },
    };
  }

  async registerEmployee(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.employees.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }
}
