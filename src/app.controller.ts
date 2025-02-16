import { Controller, Delete, Get, Patch, Post, Put } from '@nestjs/common';
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Delete()
  getHello(): string {
    return "반갑다 박박지현이다";
    // return this.appService.getHello();
  }
}
