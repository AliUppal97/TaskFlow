import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { User } from '../../entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    // Type-safe extraction of JWT from Authorization header
    // ExtractJwt is properly typed from passport-jwt, but ESLint needs explicit assertion
    const jwtExtractor = ExtractJwt.fromAuthHeaderAsBearerToken() as (request: Request) => string | null;
    const secretOrKey = configService.get<string>('jwt.accessTokenSecret');
    
    if (!secretOrKey) {
      throw new Error('JWT access token secret is not configured');
    }
    
    super({
      jwtFromRequest: jwtExtractor,
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { sub: userId } = payload;

    const user = await this.userService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}








