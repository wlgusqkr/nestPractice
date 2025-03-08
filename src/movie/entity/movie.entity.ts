import { Exclude, Expose, Transform } from "class-transformer";
import { extend } from "joi";
import { ChildEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, TableInheritance, UpdateDateColumn, VersionColumn } from "typeorm";
import { MovieDetail } from "./movie-detail.entity";
import { BaseTable } from "src/common/entity/base-table.entity";
import { Director } from "src/director/entitiy/director.entity";

// ManyToOne Director -> 감독은 여러개의 영화를 만들 수 있음
// OneToOne MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
// ManyToMany Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있다.

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  genre: string;

  @OneToOne(
    () => MovieDetail,
    movie => movie.id,
    {
      cascade: true,
      nullable: false
    }
  )
  @JoinColumn()
  detail: MovieDetail;

  @ManyToOne(
    () => Director,
    director => director.id,
    {
      cascade: true,
      nullable: false
    }
  )
  director: Director
}