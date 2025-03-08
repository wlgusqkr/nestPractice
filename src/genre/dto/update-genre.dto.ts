import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CreateGenreDto } from './create-genre.dto';

export class UpdateGenreDto {

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;
}
