import { Injectable } from "@nestjs/common";
import { PmSwitchTemplateRepository}  from "./PmSwitchTemplate.repo";

import logger from "../common/logger/logger";

@Injectable()
export class PmSwitchTemplateService {
  constructor(private pmSwitchTemplateRepo: PmSwitchTemplateRepository ) {}
  async getPmTemplates(switchUnId:string){
    
    try{
      const result = await this.pmSwitchTemplateRepo.testFunc(switchUnId);
      return result;
    }catch(err){
      logger.error("Unable to fetch templates",err)
      throw new Error('Service Error: Unable to fetch template')
    };
  };
}
