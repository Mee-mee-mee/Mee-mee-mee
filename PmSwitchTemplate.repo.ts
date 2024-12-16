import { Injectable, Logger } from "@nestjs/common";
import {Oracle}  from "../common/database/oracle";
import { queries } from "./PmSwitchTemplate.qfactory";

import logger from "../common/logger/logger";
//let oracleobject = new Oracle();
@Injectable()
export class PmSwitchTemplateRepository {
  constructor(private connection: Oracle) {}
  async testFunc(switchUnId){
    try{
    let templatesQuery=queries.getSwitchPmTemplates;
    const params = {switchUnId}
    let result = await this.connection.executeQuery(templatesQuery,params)
    return result;
    }catch(err){
      logger.error("No template found",err)
      throw err;
    }
  }
}
