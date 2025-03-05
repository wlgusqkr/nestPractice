import { Exclude, Expose, Transform } from "class-transformer";
import { extend } from "joi";
import { ChildEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from "typeorm";

export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

// movie / series -> Content
// runtime / seriesCount
@Entity()
@TableInheritance({
  column: {
    type: 'varchar',
    name: 'type'
  }
})
export class Content extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

}
@ChildEntity()
export class Movie extends Content {
  @Column()
  runtime: number;
}

@ChildEntity()
export class Serise extends Content {

  @Column()
  seriseCount: number;
} 