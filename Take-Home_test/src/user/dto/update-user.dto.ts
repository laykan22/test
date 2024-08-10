import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the user',
  })
  name?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({
    example: 'john@example.com',
    description: 'The email of the user',
  })
  email?: string;
}
