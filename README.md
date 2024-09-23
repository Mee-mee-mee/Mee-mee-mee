import { Controller, Param, Put, Req, Res } from '@nestjs/common';
import {UpdateTaskService} from './UpdateTask.service';
import { ApiTags } from '@nestjs/swagger';
import logger from '../common/logger/logger';
import { Request, Response } from 'express';




const config = require('config');
@Controller('ioppm')
@ApiTags('Default')

export class UpdateTaskController {
    constructor(private readonly UpdateTaskService: UpdateTaskService) {}

     // PM put Genreading
  @Put('/update/pmtasks')
  async putTaskReading(@Req() req: Request, @Res() res: Response) {
    try {
        // const upgenData = config.upgenData;
        // console.log(upgenData)
        const data: any = await this.UpdateTaskService.updateDetails(req);
      return res.send(data);
    } catch (err) {
      logger.error('Error in updating genreading', err);
      return res.status(500).json(err);
    }
  }
}

============================
import { Injectable } from '@nestjs/common';
import  UpdateTaskRepo from  './UpdateTask.repo';


@Injectable()
export class UpdateTaskService {

  constructor(private UpdateTaskRepo: UpdateTaskRepo) {}
  async updateDetails(req) {
      try {
        const data = await this.UpdateTaskRepo.updatetask(req);
        const data_json= {"message": "Readings added/updated successfully","data": req.body}
        return data_json;
      } catch (error) {
        throw error;
      }
}
    }
========================
import { Injectable } from '@nestjs/common';
import  Oracle  from '../common/database/oracle';
import { queries } from './UpdateTask.qFactory';

@Injectable()
export default class UpdateGenReadingRepo {
  constructor(private oraUtil: Oracle) {}

  async updatetask(req: any){
    try{
       
    const query = queries.updatetask;
    const pmtasks = req.body.pm.pmtasks;
    console.log(pmtasks)
    const META_CREATED_BY= req.body.pm.userid;
    var result;
    for (let task of pmtasks) {
        let status=task['status'];
        let task_unid = task['task_unid'];
        const qParams=[status,META_CREATED_BY,task_unid];
        var data: any=await this.oraUtil.executeQuery(query,qParams);
        result=data.rowsaffected;
    }
    
    return result;
    } catch (error) {
      throw error;
    }
}
}
