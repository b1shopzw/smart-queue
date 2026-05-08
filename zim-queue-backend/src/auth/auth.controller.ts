import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login as an employee or admin' })
  async login(@Body() body: { emp_id: string; password?: string }) {
    // For legacy support or simpler dev, we might allow login with just emp_id
    // but here we check password if provided.
    const user = await this.authService.validateUser(body.emp_id, body.password || 'password123');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new employee' })
  async register(@Body() data: any) {
    return this.authService.registerEmployee(data);
  }
}
