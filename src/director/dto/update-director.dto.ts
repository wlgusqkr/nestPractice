import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator';
import { CreateDirectorDto } from './create-director.dto';

export class UpdateDirectorDto {

  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  dob?: Date;

  @IsNotEmpty()
  @IsOptional()
  nationality?: string;


}
