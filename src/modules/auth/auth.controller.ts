import { Controller, Post, Body, HttpCode, HttpStatus, Get, Headers, Inject } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

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
  constructor(
    private authService: AuthService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) { }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.info('User registration attempt', {
      username: registerDto.username,
      email: registerDto.email,
    });

    try {
      const result = await this.authService.register(
        registerDto.username,
        registerDto.password,
        registerDto.email,
      );
      this.logger.info('User registered successfully', {
        username: registerDto.username,
      });
      return result;
    } catch (error) {
      this.logger.error('User registration failed', {
        username: registerDto.username,
        error: error.message,
      });
      throw error;
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.logger.info('User login attempt', {
      username: loginDto.username,
    });

    try {
      const result = await this.authService.login(loginDto.username, loginDto.password);
      this.logger.info('User logged in successfully', {
        username: loginDto.username,
      });
      return result;
    } catch (error) {
      this.logger.warn('User login failed', {
        username: loginDto.username,
        error: error.message,
      });
      throw error;
    }
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
      this.logger.warn('Logout attempt without token');
      return { message: 'No token provided' };
    }

    try {
      const result = await this.authService.logout(token);
      this.logger.info('User logged out successfully');
      return result;
    } catch (error) {
      this.logger.error('Logout failed', {
        error: error.message,
      });
      throw error;
    }
  }
}
