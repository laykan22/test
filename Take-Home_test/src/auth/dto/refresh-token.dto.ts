import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'your-refresh-token-here',
    description: 'Refresh token provided during login',
  })
  refreshToken: string;
}
