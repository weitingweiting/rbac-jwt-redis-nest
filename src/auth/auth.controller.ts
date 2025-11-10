import { Controller, Post, Body, HttpCode, HttpStatus, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

class RegisterDto {
  username: string;
  password: string;
  email: string;
}

class LoginDto {
  username: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.email,
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return {
      message: 'User profile',
      user,
    };
  }

  @Post('refresh')
  async refreshToken(@CurrentUser() user: any) {
    return this.authService.refreshToken(user.id);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Headers('authorization') authorization: string) {
    const token = authorization?.replace('Bearer ', '');
    if (!token) {
      return { message: 'No token provided' };
    }
    return this.authService.logout(token);
  }
}
