
import { Controller, Param, Get, Req, Res } from '@nestjs/common';
import { TaskService } from './task.service';
import { ApiTags } from '@nestjs/swagger';
import logger from '../../config/Log.config';
import { Request, Response } from 'express';

const config = require('config');
@Controller('ioppm')
@ApiTags('Default')
export class TaskController {
  constructor(private taskService: TaskService) {}
  //This will return the tasks associated with a PM
  @Get('/pm/:pmHeaderId/tasks')
  async getTasksByPm(
    @Param('pmHeaderId') pmHeaderId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const pmData: any = await  this.taskService.PmData(pmHeaderId);
      config.pmData;

      if (pmData.length == 0) {
        return res.status(204).send();
      } else {
        return res.send(pmData);
      }
    } catch (err) {
      logger.error(' No tasks found for PM ', err);
      return res.status(500).json(err);
    }
  }
}

-----------------------------------
import { Injectable } from '@nestjs/common';
import taskrepo from "./task.repo";

@Injectable()
export class TaskService {
    constructor(private taskrepo: taskrepo) {}

    async PmData(pmHeaderId) {
        try {
            const { headerData, pmtasks } = await this.taskrepo.pmSData(pmHeaderId);

            const transformedData = pmtasks.map(item => {
                const lowerCaseItem = {};
                for (const key in item) {
                    if (item.hasOwnProperty(key)) {
                        lowerCaseItem[key.toLowerCase()] = item[key];
                    }
                }
                return lowerCaseItem;
            });

            return { 
                headerData, 
                pmtasks: transformedData 
            };

        } catch (error) {
            throw error;
        }
    }
}
----------------------------------------
import { Injectable } from '@nestjs/common';
import Oracle from '../common/database/oracle';
import { queries } from "./task.qFactory";

@Injectable()
export default class taskrepo {
    constructor(private oraUtil: Oracle) {}

    async pmSData(pmHeaderId) {
        try {
            // Fetch the pmtasks and header data
            const query = queries.getTestById;
            const qParams = [pmHeaderId];
            let pmData: any = await this.oraUtil.executeQuery(query, qParams);
            pmData = pmData.rows;

            const query1 = queries.getestById;
            let headerData1: any = await this.oraUtil.executeQuery(query1, qParams);

            // For each task, fetch the availablestatuses
            const statusQuery = queries.getTestbyId;
            const statusParams = [pmHeaderId];
            let statusData: any = await this.oraUtil.executeQuery(statusQuery, statusParams);
            const statusArray = statusData.rows.map(row => row.STATUS_ID);
            for (let task of pmData) {
                // Extract STATUS_ID values

                // Attach availablestatuses to each task
                task.availablestatuses = statusArray;
            }

            return {
                headerData: headerData1.rows,
                pmtasks: pmData
            };
        } catch (error) {
            throw error;
        }
    }
}
-------------------------------------------
export const queries = {
    getTestById:` 
    SELECT
    c.CATEGORY_NAME AS category,
    a.HELP_TEXT AS cfd_helptext_coverted,
    a.COMMENTS AS comments,
    d.STATUS_NAME AS defaultstatus,
    a.IS_OPTIONAL AS isoptional,
    a.META_CREATED_BY AS meta_createdby,
    a.META_CREATED_DATE AS meta_createddate,
    a.META_LAST_UPDATED_BY AS meta_lastupdateby,
    a.META_LAST_UPDATED_DATE AS meta_lastupdatedate,
    a.META_UNIVERSAL_ID AS meta_universalid,
    a.MINUTES_EST AS minutes_est,
    e.SPECIFIC_DATA_DESC AS specifictask,
    e.SPECIFIC_DATA_VALUE AS specifictask_value,
    a.TASK_NAME AS taskname,
    d.STATUS_ID AS status
FROM
    opspm.PM_TASK_LIST_ITEM a
LEFT JOIN
    opspm.PM_TEMPLATE_TASK b ON a.TASK_ID = b.TASK_ID
LEFT JOIN
    opspm.PM_TASK_CATEGORY c ON a.CATEGORY_ID = c.CATEGORY_ID
LEFT JOIN
    opspm.PM_STATUS d ON a.DEFAULT_STATUS_ID = d.STATUS_ID
LEFT JOIN
    opspm.PM_SPECIFIC_DATA e ON a.SPECIFIC_DATA_ID = e.SPECIFIC_DATA_ID
	LEFT JOIN
  opspm.PM_FREQUENCY f on a.FREQUENCY_ID= f.FREQUENCY_ID
  LEFT JOIN
  ops_Pm_data s ON s.FREQUENCY= f.FREQUENCY_NAME
    WHERE s.PM_UNID = :pmHeaderId
    `,
    getestById: `
     SELECT 
    
    pmd_widget_pm_details.NUM_OF_TASKS AS numtasks, 
    pmd_widget_pm_details.NUM_OF_TASKS_DONE AS numstasksdone 
   
FROM 
    pmd_widget_pm_details
 
     WHERE pmd_widget_pm_details.PM_UNID = :pmHeaderId 

    `,
    getTestbyId:`
    SELECT DISTINCT a.STATUS_ID
FROM opspm.PM_TASK_AVAILABLE_STATUS_ITEM a
JOIN OPSPM.PM_LOCATION_TASK b
ON a.TASK_ID = b.TASK_ID
WHERE b.PM_HEADER_ID = :pmHeaderId  
    `
};
===========================
{
    "headerData": {
        "numtasks": 8,
        "numtasksdone": 8
    },
    "pmtasks": [
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "DATA",
            "cfd_helptext_converted": "Verify:\n-Emergency Contact and Callout Information\n-Directions and Access information\n-GPS Coordinates\n-Verify meter number matches the database used by your territory.  \n-Ensure the meter number matches <a href=\"https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx\" target=\"_blank\" title=\"Link to 'https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx'\">ENGIE</a> to be sure we are being billed for the correct meter.  \n-Verify there is only 1 meter in use (unless the primary meter has power restrictions requiring the 2nd meter).\n\nVerify that the equipment inventory listed in IOP/Ops Tracker is exactly what is onsite - this includes the manufacturer and model are exactly the same, counts of batteries strings and cell is exactly the same. Photos of the generator nameplate and battery labels should be taken and uploaded to Fuze. The following equipment shall be verified for accuracy:\nBatteries\nGenerator\nFuel Tank\nDCPP/Rectifiers\nHVAC\nOnce the equipment is verified, click the Verify site button in IOP or FUZE Compliance.",
            "cfd_origcrc": "ae756a807e8a17c8b180fb96e257dae2",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "4BB4EDA24D3834A8F272C88F5666264E",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "P",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:26",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Verify Site Information",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "ENVIRONMENTAL/COMPLIANCE",
            "cfd_helptext_converted": "Site Signage EME,RF,HAZMAT, ASR, etc. \nVerify all compliance signs are posted: EME signs on door & tower; FCC Tower ID signs at entry and tower; HAZMAT signs at entry; FCC Call sign on door; NOC sign with name on door. Emergency response, Custodian License, fire triangle, IVR, RF Notice, No Trespassing, etc. Ensure Emergency Spill response hotline posted on inside of door.0",
            "cfd_origcrc": "863ef4db40f073d73bb5ff75d1c878ca",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "9D5416EF484BB43BF1B1A85E8EEC40C0",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "P",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:29",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Environmental, Compliance & VZW RF Signage as applicable",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "FACILITY",
            "cfd_helptext_converted": "1) Power Down, un-slot, remove or consolidate unused components such as:\n    . Cards\n    . Radios\n    .  Amplifiers\n    . Modems\n    . Converters/Rectifiers\n    . Frames/Racks \n    . Etc.\n2) Verify HVAC thermostat settings - reference NSTD1000\n3) Ensure automated lighting is working properly where equipped/installed\n4) Verify no unauthorized connections to AC feed - particularly external outlets",
            "cfd_origcrc": "8d60d866e689905ffd7c86a7575d282b",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "E288926318AC3536B839D1052BADCCCE",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "P",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:33",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Cell Site Expense Reduction",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "FACILITY",
            "cfd_helptext_converted": "Verify that proper labeling is present for coax cables, fiber cabling and  microwave.\nVerify that no alarms are present.",
            "cfd_origcrc": "d8a7dc3c9fbafdcfbc4710311e0c9558",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "3F49D9108A812E8ABF101C741244177C",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "P",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:34",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Verify labeling on Facility Terminals / Demarc is accurate and complete.",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "FIRE INSPECTION",
            "cfd_helptext_converted": "Vendor performs fire suppression testing and reports results. Enter date of last fire extinguisher inspection.",
            "cfd_origcrc": "0dfd72299cee6c91e112a0765e510bd2",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "60DFD995C319FFDDE69D18B6A775B6A8",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "NA",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:35",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Fire Safety",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "HVAC",
            "cfd_helptext_converted": "Inspect and cycle all HVAC units for proper operation. Check all vents for obstructions and check that filters are present and clean. Check AC surge suppresser for proper operation and/or damage.\nReference OTHR238115 for guidance.",
            "cfd_origcrc": "2c7cc048a88d7ae067a60939380db659",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "95EAA356906E701CCBB573C8DC99C699",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "NA",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:40",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "HVAC Check: Clean vents; A/C temperature set to VZW Standards",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "PHYSICAL SITE",
            "cfd_helptext_converted": "-Visual inspection of compound: Fences, gates, grounding, condition of shelter, etc. \n-Walk perimeter of facility for any issues like weed abatement, debris, graffiti, trees in path, visual cracks or any concerns about the roof. \n- Visual inspection of towers, guyed wires and antennas. \n-Check cables / cable penetrations / conduit / antennas / antenna jumpers / GPS antenna / GPS cable weatherproofing / site ground bar / grounding cable / cable tray covers / etc. \n-Verify external lighting is functional.\n-Verify the external outlets are \"killed\" - not operational.\n-Visual inspection of grounding of fence, compound, HVAC, generator, cabinets, down-guy anchor points, shelter, etc.\n-Ensure that all gates/doors/latches, etc. are in good working condition.\n-Confirm operation and programming of any smart locking system components such as keys, keypads, etc.\n- Reference NSTD2030",
            "cfd_origcrc": "9d607a7cb6980a70957b42aee8563c67",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "ADAE0CB68BBCD9DDA4939DC9092664A5",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "P",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:36",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Building  and Compound Exterior",
            "widgetStatus": "",
            "widgetId": ""
        },
        {
            "availablestatuses": [
                "I",
                "P",
                "F",
                "NA"
            ],
            "category": "SAFETY / COMPLIANCE",
            "cfd_helptext_converted": "Verify Safety Board contents including First Aid kits, Eyewash Kits, Spill Kits, Ear Protection, etc. (Some sites may or may not have all these items). Verify battery spill kit present (if applicable). Verify kits are in place and have not expired.\nNote expiration dates of Eyewash Kit and First Aid Kit.",
            "cfd_origcrc": "26c3aa692330a3a907ae3200f5a71dfe",
            "cfd_origlastupdate": "2023-06-20 00:13:44",
            "cfd_specific_task_definition": {},
            "comments": "",
            "defaultstatus": "I",
            "isdone": "1",
            "meta_createddate": "2022-12-30 18:20:06",
            "meta_createdby": "c2",
            "meta_lastupdatedate": "2023-06-20 00:13:44",
            "meta_lastupdateby": "herke3v",
            "task_unid": "2824F9B6F7A943A3D538CC35D1168698",
            "sortorder": "0",
            "pm_unid": "76CE295CB3A2696AAEC7254C60813F8E",
            "specifictask": "",
            "specifictask_value": "",
            "status": "NA",
            "statusidstamp": "herke3v",
            "statusnamestamp": "Herriman, Kendal",
            "statustimestamp": "2023-06-20 00:13:37",
            "statusvendor_id": "0",
            "statusvendor_name": "",
            "taskname": "Site Safety Verification & Expiration Dates",
            "widgetStatus": "",
            "widgetId": ""
        }
    ]
}
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import { Controller, Param, Put, Req, Res } from '@nestjs/common';
import { UpdatePmTaskService } from './updatepmTask.service';
import { ApiTags } from '@nestjs/swagger';
import logger from '../../config/Log.config';
import { Request, Response } from 'express';




const config = require('config');
@Controller('ioppm')
@ApiTags('Default')

export class UpdatePmTaskController {
    constructor(private readonly UpdatePmTaskService: UpdatePmTaskService) {}

     // PM put Genreading
  @Put('/update/pmtasks')
  async putGenReading(@Req() req: Request, @Res() res: Response) {
    try {
        // const upgenData = config.upgenData;
        // console.log(upgenData)
        const data: any = await this.UpdatePmTaskService.updateDetails(req);
      return res.send(data);
    } catch (err) {
      logger.error('Error in updating genreading', err);
      return res.status(500).json(err);
    }
}
================================
import { Injectable } from '@nestjs/common';
import UpdatePmTaskRepo from './updatepmTask.repo';


@Injectable()
export class UpdatePmTaskService {

  constructor(private UpdatePmTaskRepo: UpdatePmTaskRepo) {}
  async updateDetails(req) {
      try {
        const data = await this.UpdatePmTaskRepo.updatepmtask(req);
  
        return data;
      } catch (error) {
        throw error;
      }
}
    }
    ===================================
    import { Injectable } from '@nestjs/common';
import  Oracle  from '../common/database/oracle';
import { queries } from './updatepmTask.qFactory';

@Injectable()
export default class UpdatePmTaskRepo {
  constructor(private oraUtil: Oracle) {}

  async updatepmtask(req: any){
    try{
       
    const query = queries.updatepmTask;
    const qParams=[];
    let data: any=await this.oraUtil.executeQuery(query,qParams);
      data = data.rows;
      return data;
    } catch (error) {
      throw error;
    }
}
}
=======================
export const queries={
    updatepmTask: `SELECT
    b.STATUS_ID AS availablestatuses,
    c.CATEGORY_NAME AS category,
    a.HELP_TEXT AS cfd_helptext_coverted,
    a.COMMENTS AS comments,
    d.STATUS_NAME AS defaultstatus,
    pwd.IS_DONE AS isdone,
    a.IS_OPTIONAL AS isoptional,
    a.META_CREATED_BY AS meta_createdby,
    a.META_CREATED_DATE AS meta_createddate,
    a.META_LAST_UPDATED_BY AS meta_lastupdateby,
    a.META_LAST_UPDATED_DATE AS meta_lastupdatedate,
    a.META_UNIVERSAL_ID AS meta_universalid,
    a.MINUTES_EST AS minutes_est,
    e.SPECIFIC_DATA_DESC AS specifictask,
    e.SPECIFIC_DATA_VALUE AS specifictask_value,
    d.STATUS_NAME AS status,
    a.TASK_NAME AS taskname
    

FROM
    opspm.PM_TASK_LIST_ITEM a
LEFT JOIN
    opspm.PM_TEMPLATE_TASK b ON a.TASK_ID = b.TASK_ID
LEFT JOIN
    opspm.PM_TASK_CATEGORY c ON a.CATEGORY_ID = c.CATEGORY_ID
LEFT JOIN
    opspm.PM_STATUS d ON a.DEFAULT_STATUS_ID = d.STATUS_ID
LEFT JOIN
    opspm.PM_SPECIFIC_DATA e ON a.SPECIFIC_DATA_ID = e.SPECIFIC_DATA_ID
	LEFT JOIN
  opspm.PM_FREQUENCY f on a.FREQUENCY_ID= f.FREQUENCY_ID

LEFT JOIN
OPSPM.PM_LOCATION_TASK pw
on pw.TASK_ID = a.TASK_ID

LEFT JOIN 
 pmd_widget_pm_details pwd
 on pwd.PM_UNID = pw.PM_UNID
  
  
  LEFT JOIN
  ops_Pm_data s ON s.FREQUENCY= f.FREQUENCY_NAME
    WHERE s.PM_UNID = `
}
============================================================
request body
{
    "pm": {
        "pm_unid": "161827140FDFAB630D46B100713B591E",
        "site_unid": "6BB84EAEDDB540F603A4EFF5550F1DB4",
        "userid": "bhagamu",
        "pmtasks": [
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:39:29.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "0C785037AC55469B3DD21C8101A711A7",
                "sortorder": "0",
                "taskname": "Battery Validation",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "eda949899301b79a630f4e1a110e92a7",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "BATTERY",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "-Visual inspection of batteries. Check for leaks, corrosion, temperature, swelling, proper installation of safety shields.\n-Record DC power and DC Amp readings for -24V and -48V systems.\n-Verify rectifier load sharing.\n-Ensure only N+1 rectifiers are installed.  \n-Review opportunity to consolidate plants if more than one are present - alert management of opportunities for possible implementation.\n-If converter presently in use review opportunity to remove - alert management of opportunities for possible removal to reduce utility expense."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:39:31.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "27.11",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "0E26420E68FBB1E9D4FB3F625336CF4C",
                "sortorder": "0",
                "taskname": "Record 24v battery Voltage",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "d8221f6854b5da94cd690b09f0ec59a1",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "SITE_DC_PLANTLOAD_VOLTS_24",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "BATTERY-24V",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0.00",
                    "kwdescription": "DC Plant Voltage (Volts) - 24V",
                    "kwname": "SITE_DC_PLANTLOAD_VOLTS_24"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Record DC Voltage readings for -24V systems"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:39:32.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "20",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "2E01AAA126254C9FB01357E8038846D8",
                "sortorder": "0",
                "taskname": "Record 24v battery Amperage",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "eb16f5bfd890947117fd5adeba5d5024",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "SITE_DC_PLANTLOAD_AMPS_24",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "BATTERY-24V",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0",
                    "kwdescription": "DC Plant Load (Amps) - 24V",
                    "kwname": "SITE_DC_PLANTLOAD_AMPS_24"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Record DC Amp readings for -24V systems",
                "isCommentChanged": 1
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-09-27T17:32:54.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Stockdaile, David",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "0.00",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "11CDCB1C62B2500FB2EB9418E86819F1",
                "sortorder": "0",
                "taskname": "Record 48v battery Voltage",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "NA",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "2bf915b439c8c51f51ea2af5c1480424",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "stocda1",
                "specifictask": "SITE_DC_PLANTLOAD_VOLTS_48",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "BATTERY-48V",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0.00",
                    "kwdescription": "DC Plant Voltage (Volts) - 48V",
                    "kwname": "SITE_DC_PLANTLOAD_VOLTS_48"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Record DC Voltage readings for -48V systems"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-09-27T17:32:55.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Stockdaile, David",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "0",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "D9FA7FCD52185F833695C9C8CD954016",
                "sortorder": "0",
                "taskname": "Record 48v battery Amperage",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "NA",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "ea96b344a5f178d87b4cfc9082626046",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "stocda1",
                "specifictask": "SITE_DC_PLANTLOAD_AMPS_48",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "BATTERY-48V",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0",
                    "kwdescription": "DC Plant Load (Amps) - 48V",
                    "kwname": "SITE_DC_PLANTLOAD_AMPS_48"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Record DC Amp readings for -48V systems"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:39:57.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "05BA9032FEB67AE8535AADCBFB6CD441",
                "sortorder": "0",
                "taskname": "Verify Site Information",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "29fe077379f4bec8453881111c1972cf",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "DATA",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Verify:\n-Emergency Contact and Callout Information\n-Directions and Access information\n-GPS Coordinates\n-Verify meter number matches the database used by your territory.  \n-Ensure the meter number matches <a href=\"https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx\" target=\"_blank\" title=\"Link to 'https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx'\">ENGIE</a> to be sure we are being billed for the correct meter.  \n-Verify there is only 1 meter in use (unless the primary meter has power restrictions requiring the 2nd meter).\n\nVerify that the equipment inventory listed in IOP/Ops Tracker is exactly what is onsite - this includes the manufacturer and model are exactly the same, counts of batteries strings and cell is exactly the same. Photos of the generator nameplate and battery labels should be taken and uploaded to Fuze. The following equipment shall be verified for accuracy:\nBatteries\nGenerator\nFuel Tank\nDCPP/Rectifiers\nHVAC\nOnce the equipment is verified, click the Verify site button in IOP or FUZE Compliance."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:39:59.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "571A937281596D4F28C73891E9DA96F2",
                "sortorder": "0",
                "taskname": "Environmental, Compliance & VZW RF Signage as applicable",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "8baf47aeb3ff9369ce9c18af124af380",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "ENVIRONMENTAL/COMPLIANCE",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Site Signage EME,RF,HAZMAT, ASR, etc. \nVerify all compliance signs are posted: EME signs on door & tower; FCC Tower ID signs at entry and tower; HAZMAT signs at entry; FCC Call sign on door; NOC sign with name on door. Emergency response, Custodian License, fire triangle, IVR, RF Notice, No Trespassing, etc. Ensure Emergency Spill response hotline posted on inside of door.0"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:04.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "98237524C95B7704A5C134DF8844DCCE",
                "sortorder": "0",
                "taskname": "Cell Site Expense Reduction",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "cbf2afbe0b81e498ecee3cff9838c80e",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "FACILITY",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "1) Power Down, un-slot, remove or consolidate unused components such as:\n    . Cards\n    . Radios\n    .  Amplifiers\n    . Modems\n    . Converters/Rectifiers\n    . Frames/Racks \n    . Etc.\n2) Verify HVAC thermostat settings - reference NSTD1000\n3) Ensure automated lighting is working properly where equipped/installed\n4) Verify no unauthorized connections to AC feed - particularly external outlets"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:06.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "F2A986D68185276F2943F0ABA40B1AB8",
                "sortorder": "0",
                "taskname": "Verify labeling on Facility Terminals / Demarc is accurate and complete.",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "765e57cd40ee1f609eff5701f5e0af39",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "FACILITY",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Verify that proper labeling is present for coax cables, fiber cabling and  microwave.\nVerify that no alarms are present."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:07.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "9625D6989A144B03BD930767B45096C5",
                "sortorder": "0",
                "taskname": "Fire Safety",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "NA",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "85c3c63ce1c2f9cc4603210c9b6bf3dc",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "FIRE INSPECTION",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Vendor performs fire suppression testing and reports results. Enter date of last fire extinguisher inspection."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T10:07:32.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "1D0D1C6E6CBB8045D658F7DA1F582B64",
                "sortorder": "0",
                "taskname": "FUZE Compliance Verification",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "4f12a8c640da8a3aa9f616fb38db04d0",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "SYS_FUZECOMPLIANCEVERIFICATION",
                "meta_createddate": "2023-01-02 01:20:00",
                "category": "FUZE COMPLIANCE VERIFICATION",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "||",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "STRING",
                    "kwdecimalplaces": "0",
                    "kwdefaultvalue": "",
                    "kwdescription": "-reserved- will generate \"FUZE Compliance\" link.",
                    "kwname": "SYS_FUZECOMPLIANCEVERIFICATION"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "FUZE Compliance Verification\nClick on \"Open FUZE Compliance Verification\" to perform the Verification in FUZE Compliance."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T10:07:49.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "60AD6CF554E5A36F5A1AF17454734452",
                "sortorder": "0",
                "taskname": "Collect Generator Readings",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "5eb16038176dfa84f45631c0132b0510",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "SYS_GENREADINGS",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "GENERATOR",
                "cfd_specific_task_definition": {
                    "cfd_kwvalues": "||",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "STRING",
                    "kwdecimalplaces": "0",
                    "kwdefaultvalue": "",
                    "kwdescription": "-reserved- will generate \"Take generators readings\" link.",
                    "kwname": "SYS_GENREADINGS"
                },
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Check Fuel / levels and Generator Hour Meter. Update the Generator statuses by entering the values for generator run times, fuel & oil levels, etc. Record Fuel levels and Generator Hours in Generator Log and record in Capture Specific data area. For Air Quality Districts auditors will be inspecting these logs. Diesel and Propane fuel delivery documents need to be present in Generator Log Book.\nReference NSTD1517"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:13.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "517ECDAAD73A0965D9752D13244C2CA0",
                "sortorder": "0",
                "taskname": "HVAC Check: Clean vents; A/C temperature set to VZW Standards",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "871422d43be43f8b27a86f8c6ff6dccc",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "HVAC",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Inspect and cycle all HVAC units for proper operation. Check all vents for obstructions and check that filters are present and clean. Check AC surge suppresser for proper operation and/or damage.\nReference OTHR238115 for guidance."
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:17.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "09E289EB8F772506D112FD6BD395CD24",
                "sortorder": "0",
                "taskname": "Building  and Compound Exterior",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "P",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "902b257c08d1665e59df4b714c91a577",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "PHYSICAL SITE",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "-Visual inspection of compound: Fences, gates, grounding, condition of shelter, etc. \n-Walk perimeter of facility for any issues like weed abatement, debris, graffiti, trees in path, visual cracks or any concerns about the roof. \n- Visual inspection of towers, guyed wires and antennas. \n-Check cables / cable penetrations / conduit / antennas / antenna jumpers / GPS antenna / GPS cable weatherproofing / site ground bar / grounding cable / cable tray covers / etc. \n-Verify external lighting is functional.\n-Verify the external outlets are \"killed\" - not operational.\n-Visual inspection of grounding of fence, compound, HVAC, generator, cabinets, down-guy anchor points, shelter, etc.\n-Ensure that all gates/doors/latches, etc. are in good working condition.\n-Confirm operation and programming of any smart locking system components such as keys, keypads, etc.\n- Reference NSTD2030"
            },
            {
                "statusvendor_id": "0",
                "statustimestamp": "2023-02-20T09:40:21.000Z",
                "meta_createdby": "c2",
                "statusnamestamp": "Collier, Kc",
                "meta_lastupdatedate": "2023-09-27 23:02:59",
                "specifictask_value": "",
                "availablestatuses": [
                    "I¤P¤F¤NA"
                ],
                "isdone": "1",
                "task_unid": "0ECA177FCD863D6209B7F3064802921B",
                "sortorder": "0",
                "taskname": "Site Safety Verification & Expiration Dates",
                "meta_lastupdateby": "stocda1",
                "statusvendor_name": "",
                "status": "NA",
                "defaultstatus": "I",
                "comments": "",
                "cfd_origcrc": "24261fdce984c04b9bdd906a3acae591",
                "pm_unid": "161827140FDFAB630D46B100713B591E",
                "widgetStatus": "",
                "statusidstamp": "collikc",
                "specifictask": "",
                "meta_createddate": "2022-12-30 23:44:45",
                "category": "SAFETY / COMPLIANCE",
                "cfd_specific_task_definition": {},
                "cfd_origlastupdate": "2023-09-27 23:02:59",
                "widgetId": "",
                "cfd_helptext_converted": "Verify Safety Board contents including First Aid kits, Eyewash Kits, Spill Kits, Ear Protection, etc. (Some sites may or may not have all these items). Verify battery spill kit present (if applicable). Verify kits are in place and have not expired.\nNote expiration dates of Eyewash Kit and First Aid Kit."
            }
        ],
        "pmd_widget_id": "10033609",
        "status": "WIP",
        "actual_status": "IN PROGRESS"
    }
}
=====================
response body

{
    "message": "PM tasks updated successfully",
    "pm": {
        "pm_unid": "F19C1DF01405E86873CD9305013ED73D",
        "userid": "bhagamu",
        "numtasksdone": 13,
        "pmtasks": [
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "BATTERY",
                "cfd_gam_currentdoc_description": "0CD7BFBE9F967C79E18ED71DCD1EF138",
                "cfd_helptext_converted": "-Visual inspection of batteries. Check for leaks, corrosion, temperature, swelling, proper installation of safety shields.\n-Record DC power and DC Amp readings for -24V and -48V systems.\n-Verify rectifier load sharing.\n-Ensure only N+1 rectifiers are installed.  \n-Review opportunity to consolidate plants if more than one are present - alert management of opportunities for possible implementation.\n-If converter presently in use review opportunity to remove - alert management of opportunities for possible removal to reduce utility expense.",
                "cfd_origcrc": "f17426c728e057fceee112c6af886d84",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "00DF37F7BDDD01C86DC47963B104BCA6",
                "helptext": "-Visual inspection of batteries. Check for leaks, corrosion, temperature, swelling, proper installation of safety shields.\n-Record DC power and DC Amp readings for -24V and -48V systems.\n-Verify rectifier load sharing.\n-Ensure only N+1 rectifiers are installed.  \n-Review opportunity to consolidate plants if more than one are present - alert management of opportunities for possible implementation.\n-If converter presently in use review opportunity to remove - alert management of opportunities for possible removal to reduce utility expense.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "0CD7BFBE9F967C79E18ED71DCD1EF138",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:18",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Battery Validation",
                "task_unid": "0CD7BFBE9F967C79E18ED71DCD1EF138"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "BATTERY-48V",
                "cfd_gam_currentdoc_description": "67F6518988823CC69FE0C6736E7309C6",
                "cfd_helptext_converted": "Record DC Voltage readings for -48V systems",
                "cfd_origcrc": "460ebb288a0769c3de1b4d9d7a6e26e4",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": {
                    "cfd_gam_currentdoc_description": "SITE_DC_PLANTLOAD_VOLTS_48",
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0.00",
                    "kwdescription": "DC Plant Voltage (Volts) - 48V",
                    "kwname": "SITE_DC_PLANTLOAD_VOLTS_48",
                    "meta_createdby": "WIN-VZWNET\\c0nguma",
                    "meta_createddate": "2015-09-02 08:41:31",
                    "meta_lastupdateby": "WIN-VZWNET\\c2",
                    "meta_lastupdatedate": "2015-10-06 10:14:02",
                    "meta_universalid": "C5149A563CF5AA3DB544C23DD277F7B7"
                },
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "8D6C191E83C5F28A0AA334F404DE2371",
                "helptext": "Record DC Voltage readings for -48V systems",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "67F6518988823CC69FE0C6736E7309C6",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "SITE_DC_PLANTLOAD_VOLTS_48",
                "specifictask_value": "0.00",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:19",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Record 48v battery Voltage",
                "task_unid": "67F6518988823CC69FE0C6736E7309C6"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "BATTERY-48V",
                "cfd_gam_currentdoc_description": "9514266BA96B870AB0F2716CEF61E3BC",
                "cfd_helptext_converted": "Record DC Amp readings for -48V systems",
                "cfd_origcrc": "1925cc946b01a9e5fe332880024afe7e",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": {
                    "cfd_gam_currentdoc_description": "SITE_DC_PLANTLOAD_AMPS_48",
                    "cfd_kwvalues": "",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "NUMBER",
                    "kwdecimalplaces": "2",
                    "kwdefaultvalue": "0",
                    "kwdescription": "DC Plant Load (Amps) - 48V",
                    "kwname": "SITE_DC_PLANTLOAD_AMPS_48",
                    "meta_createdby": "WIN-VZWNET\\c0nguma",
                    "meta_createddate": "2015-09-02 08:40:35",
                    "meta_lastupdateby": "WIN-VZWNET\\c2",
                    "meta_lastupdatedate": "2015-10-06 10:13:55",
                    "meta_universalid": "2406272B63B22B97CC8F098E032B4EE5"
                },
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "9BA338A4F407C43489AA59B6110CA419",
                "helptext": "Record DC Amp readings for -48V systems",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "9514266BA96B870AB0F2716CEF61E3BC",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "SITE_DC_PLANTLOAD_AMPS_48",
                "specifictask_value": "0",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:20",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Record 48v battery Amperage",
                "task_unid": "9514266BA96B870AB0F2716CEF61E3BC"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "DATA",
                "cfd_gam_currentdoc_description": "34DF8DF42E5FFE6D4BE3B362B32D5A87",
                "cfd_helptext_converted": "Verify:\n-Emergency Contact and Callout Information\n-Directions and Access information\n-GPS Coordinates\n-Verify meter number matches the database used by your territory.  \n-Ensure the meter number matches <a href=\"https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx\" target=\"_blank\" title=\"Link to 'https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx'\">ENGIE</a> to be sure we are being billed for the correct meter.  \n-Verify there is only 1 meter in use (unless the primary meter has power restrictions requiring the 2nd meter).\n\nVerify that the equipment inventory listed in IOP/Ops Tracker is exactly what is onsite - this includes the manufacturer and model are exactly the same, counts of batteries strings and cell is exactly the same. Photos of the generator nameplate and battery labels should be taken and uploaded to Fuze. The following equipment shall be verified for accuracy:\nBatteries\nGenerator\nFuel Tank\nDCPP/Rectifiers\nHVAC\nOnce the equipment is verified, click the Verify site button in IOP or FUZE Compliance.",
                "cfd_origcrc": "428bfb893501bb0f0aba721f5d724aac",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "BF7317ED9C20F8451380B2EF2EE186AC",
                "helptext": "Verify:\n-Emergency Contact and Callout Information\n-Directions and Access information\n-GPS Coordinates\n-Verify meter number matches the database used by your territory.  \n-Ensure the meter number matches [[LINK:https://platform1.engieinsight.com/sites/Verizon/SitePages/Dashboard.aspx]]ENGIE[[\\LINK]] to be sure we are being billed for the correct meter.  \n-Verify there is only 1 meter in use (unless the primary meter has power restrictions requiring the 2nd meter).\n\nVerify that the equipment inventory listed in IOP/Ops Tracker is exactly what is onsite - this includes the manufacturer and model are exactly the same, counts of batteries strings and cell is exactly the same. Photos of the generator nameplate and battery labels should be taken and uploaded to Fuze. The following equipment shall be verified for accuracy:\nBatteries\nGenerator\nFuel Tank\nDCPP/Rectifiers\nHVAC\nOnce the equipment is verified, click the Verify site button in IOP or FUZE Compliance.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "34DF8DF42E5FFE6D4BE3B362B32D5A87",
                "minutes_est": "5",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:22",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Verify Site Information",
                "task_unid": "34DF8DF42E5FFE6D4BE3B362B32D5A87"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "ENVIRONMENTAL/COMPLIANCE",
                "cfd_gam_currentdoc_description": "A8C975AE9DA3A68B99B9817A978D26DD",
                "cfd_helptext_converted": "Site Signage EME,RF,HAZMAT, ASR, etc. \nVerify all compliance signs are posted: EME signs on door & tower; FCC Tower ID signs at entry and tower; HAZMAT signs at entry; FCC Call sign on door; NOC sign with name on door. Emergency response, Custodian License, fire triangle, IVR, RF Notice, No Trespassing, etc. Ensure Emergency Spill response hotline posted on inside of door.0",
                "cfd_origcrc": "9bc34f62b53b1a462e8bac0c3fd4c102",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "FB654839CC144B594EE58ADBE0F96413",
                "helptext": "Site Signage EME,RF,HAZMAT, ASR, etc. \nVerify all compliance signs are posted: EME signs on door & tower; FCC Tower ID signs at entry and tower; HAZMAT signs at entry; FCC Call sign on door; NOC sign with name on door. Emergency response, Custodian License, fire triangle, IVR, RF Notice, No Trespassing, etc. Ensure Emergency Spill response hotline posted on inside of door.0",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "A8C975AE9DA3A68B99B9817A978D26DD",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:23",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Environmental, Compliance & VZW RF Signage as applicable",
                "task_unid": "A8C975AE9DA3A68B99B9817A978D26DD"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "FACILITY",
                "cfd_gam_currentdoc_description": "037CF49372C499EDD015DC781B327EC2",
                "cfd_helptext_converted": "Verify that proper labeling is present for coax cables, fiber cabling and  microwave.\nVerify that no alarms are present.",
                "cfd_origcrc": "ea349f8a938f0f3dc05fce21e8dd6880",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "88F8AD2F2C13D462BCA0B81AA20EA631",
                "helptext": "Verify that proper labeling is present for coax cables, fiber cabling and  microwave.\nVerify that no alarms are present.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "037CF49372C499EDD015DC781B327EC2",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:25",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Verify labeling on Facility Terminals / Demarc is accurate and complete.",
                "task_unid": "037CF49372C499EDD015DC781B327EC2"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "FACILITY",
                "cfd_gam_currentdoc_description": "69CF5F64327BA21445EC8D823B207342",
                "cfd_helptext_converted": "1) Power Down, un-slot, remove or consolidate unused components such as:\n    . Cards\n    . Radios\n    .  Amplifiers\n    . Modems\n    . Converters/Rectifiers\n    . Frames/Racks \n    . Etc.\n2) Verify HVAC thermostat settings - reference NSTD1000\n3) Ensure automated lighting is working properly where equipped/installed\n4) Verify no unauthorized connections to AC feed - particularly external outlets",
                "cfd_origcrc": "be54db40ac1276b39ad13871fb5f4a5a",
                "cfd_origlastupdate": "2023-08-25 12:14:44",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "08A5B132409AF269E9D8AA9F08CE91AE",
                "helptext": "1) Power Down, un-slot, remove or consolidate unused components such as:\n    . Cards\n    . Radios\n    .  Amplifiers\n    . Modems\n    . Converters/Rectifiers\n    . Frames/Racks \n    . Etc.\n2) Verify HVAC thermostat settings - reference NSTD1000\n3) Ensure automated lighting is working properly where equipped/installed\n4) Verify no unauthorized connections to AC feed - particularly external outlets",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:44",
                "meta_universalid": "69CF5F64327BA21445EC8D823B207342",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:26",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Cell Site Expense Reduction",
                "task_unid": "69CF5F64327BA21445EC8D823B207342"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "FIRE INSPECTION",
                "cfd_gam_currentdoc_description": "D4003B6A9F5E98420819F8DBCF8D6293",
                "cfd_helptext_converted": "Vendor performs fire suppression testing and reports results. Enter date of last fire extinguisher inspection.",
                "cfd_origcrc": "1c407d65c309cbcb2647a2b1770f0c19",
                "cfd_origlastupdate": "2023-08-25 12:14:45",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "0EE294D813CED71B704691EFA3686192",
                "helptext": "Vendor performs fire suppression testing and reports results. Enter date of last fire extinguisher inspection.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:45",
                "meta_universalid": "D4003B6A9F5E98420819F8DBCF8D6293",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "NA",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:28",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Fire Safety",
                "task_unid": "D4003B6A9F5E98420819F8DBCF8D6293"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "FUZE COMPLIANCE VERIFICATION",
                "cfd_gam_currentdoc_description": "9AB51645FCF79B3E267A1793E11586C9",
                "cfd_helptext_converted": "FUZE Compliance Verification\nClick on \"Open FUZE Compliance Verification\" to perform the Verification in FUZE Compliance.",
                "cfd_origcrc": "164173c47ebdb59dd7acf1cce7e3e34d",
                "cfd_origlastupdate": "2023-08-25 12:14:45",
                "cfd_specific_task_definition": {
                    "cfd_gam_currentdoc_description": "SYS_FUZECOMPLIANCEVERIFICATION",
                    "cfd_kwvalues": "||",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "STRING",
                    "kwdecimalplaces": "0",
                    "kwdefaultvalue": "",
                    "kwdescription": "-reserved- will generate \"FUZE Compliance\" link.",
                    "kwname": "SYS_FUZECOMPLIANCEVERIFICATION",
                    "meta_createdby": "c2",
                    "meta_createddate": "2022-07-20 19:26:17",
                    "meta_lastupdateby": "c2",
                    "meta_lastupdatedate": "2022-07-20 19:26:17",
                    "meta_universalid": "E8F15191122A433CC7C29F2F68710024"
                },
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "8B789E040E4C7036893E1BE896FB78BA",
                "helptext": "FUZE Compliance Verification\nClick on \"Open FUZE Compliance Verification\" to perform the Verification in FUZE Compliance.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2023-01-02 03:37:55",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:45",
                "meta_universalid": "9AB51645FCF79B3E267A1793E11586C9",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "SYS_FUZECOMPLIANCEVERIFICATION",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:30",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "FUZE Compliance Verification",
                "task_unid": "9AB51645FCF79B3E267A1793E11586C9"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "GENERATOR",
                "cfd_gam_currentdoc_description": "AC49247708223EAFE606CDC637B7FC98",
                "cfd_helptext_converted": "Check Fuel / levels and Generator Hour Meter. Update the Generator statuses by entering the values for generator run times, fuel & oil levels, etc. Record Fuel levels and Generator Hours in Generator Log and record in Capture Specific data area. For Air Quality Districts auditors will be inspecting these logs. Diesel and Propane fuel delivery documents need to be present in Generator Log Book.\nReference NSTD1517",
                "cfd_origcrc": "a3f592fecc2ce2b50a3f143fd9e8fca5",
                "cfd_origlastupdate": "2023-08-25 12:14:45",
                "cfd_specific_task_definition": {
                    "cfd_gam_currentdoc_description": "SYS_GENREADINGS",
                    "cfd_kwvalues": "||",
                    "kwcategory": "PM Specific Tasks",
                    "kwdatatype": "STRING",
                    "kwdecimalplaces": "0",
                    "kwdefaultvalue": "",
                    "kwdescription": "-reserved- will generate \"Take generators readings\" link.",
                    "kwname": "SYS_GENREADINGS",
                    "meta_createdby": "WIN-VZWNET\\c2",
                    "meta_createddate": "2009-06-29 08:27:55",
                    "meta_lastupdateby": "WIN-VZWNET\\c2",
                    "meta_lastupdatedate": "2009-06-29 08:27:55",
                    "meta_universalid": "D0064379C672C0217587F779F3BD5919"
                },
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "9876AE1323CCE353093FF3C1CA050244",
                "helptext": "Check Fuel / levels and Generator Hour Meter. Update the Generator statuses by entering the values for generator run times, fuel & oil levels, etc. Record Fuel levels and Generator Hours in Generator Log and record in Capture Specific data area. For Air Quality Districts auditors will be inspecting these logs. Diesel and Propane fuel delivery documents need to be present in Generator Log Book.\nReference NSTD1517",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:45",
                "meta_universalid": "AC49247708223EAFE606CDC637B7FC98",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "SYS_GENREADINGS",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:31",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Collect Generator Readings",
                "task_unid": "AC49247708223EAFE606CDC637B7FC98"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "HVAC",
                "cfd_gam_currentdoc_description": "7E308952653FDEAE1DD29E2748FCC48C",
                "cfd_helptext_converted": "Inspect and cycle all HVAC units for proper operation. Check all vents for obstructions and check that filters are present and clean. Check AC surge suppresser for proper operation and/or damage.\nReference OTHR238115 for guidance.",
                "cfd_origcrc": "9f97ee92f5f890a81baaf7d17def2121",
                "cfd_origlastupdate": "2023-08-25 12:14:45",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "2EB460C9318D1130BB7A98219B91150E",
                "helptext": "Inspect and cycle all HVAC units for proper operation. Check all vents for obstructions and check that filters are present and clean. Check AC surge suppresser for proper operation and/or damage.\nReference OTHR238115 for guidance.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:45",
                "meta_universalid": "7E308952653FDEAE1DD29E2748FCC48C",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "P",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:33",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "HVAC Check: Clean vents; A/C temperature set to VZW Standards",
                "task_unid": "7E308952653FDEAE1DD29E2748FCC48C"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "PHYSICAL SITE",
                "cfd_gam_currentdoc_description": "7501DF6C54433D19482C786BF79B5B08",
                "cfd_helptext_converted": "-Visual inspection of compound: Fences, gates, grounding, condition of shelter, etc. \n-Walk perimeter of facility for any issues like weed abatement, debris, graffiti, trees in path, visual cracks or any concerns about the roof. \n- Visual inspection of towers, guyed wires and antennas. \n-Check cables / cable penetrations / conduit / antennas / antenna jumpers / GPS antenna / GPS cable weatherproofing / site ground bar / grounding cable / cable tray covers / etc. \n-Verify external lighting is functional.\n-Verify the external outlets are \"killed\" - not operational.\n-Visual inspection of grounding of fence, compound, HVAC, generator, cabinets, down-guy anchor points, shelter, etc.\n-Ensure that all gates/doors/latches, etc. are in good working condition.\n-Confirm operation and programming of any smart locking system components such as keys, keypads, etc.\n- Reference NSTD2030",
                "cfd_origcrc": "c8ff7b2b4e270710a44e08766a5f763b",
                "cfd_origlastupdate": "2024-08-19 08:16:59",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "56635CF71CB77E1EC63DA26AB75652C1",
                "helptext": "-Visual inspection of compound: Fences, gates, grounding, condition of shelter, etc. \n-Walk perimeter of facility for any issues like weed abatement, debris, graffiti, trees in path, visual cracks or any concerns about the roof. \n- Visual inspection of towers, guyed wires and antennas. \n-Check cables / cable penetrations / conduit / antennas / antenna jumpers / GPS antenna / GPS cable weatherproofing / site ground bar / grounding cable / cable tray covers / etc. \n-Verify external lighting is functional.\n-Verify the external outlets are \"killed\" - not operational.\n-Visual inspection of grounding of fence, compound, HVAC, generator, cabinets, down-guy anchor points, shelter, etc.\n-Ensure that all gates/doors/latches, etc. are in good working condition.\n-Confirm operation and programming of any smart locking system components such as keys, keypads, etc.\n- Reference NSTD2030",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "rkad3ge",
                "meta_lastupdatedate": "2024-08-19 08:16:59",
                "meta_universalid": "7501DF6C54433D19482C786BF79B5B08",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "NA",
                "statusidstamp": "rkad3ge",
                "statusnamestamp": "Rk, Adarsh",
                "statustimestamp": "2024-08-19 08:16:54",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Building  and Compound Exterior",
                "task_unid": "7501DF6C54433D19482C786BF79B5B08"
            },
            {
                "availablestatuses": [
                    "I",
                    "P",
                    "F",
                    "NA"
                ],
                "category": "SAFETY / COMPLIANCE",
                "cfd_gam_currentdoc_description": "2CFBEA2E2B99E2CCC97F0132D4CE3023",
                "cfd_helptext_converted": "Verify Safety Board contents including First Aid kits, Eyewash Kits, Spill Kits, Ear Protection, etc. (Some sites may or may not have all these items). Verify battery spill kit present (if applicable). Verify kits are in place and have not expired.\nNote expiration dates of Eyewash Kit and First Aid Kit.",
                "cfd_origcrc": "996315a96fa01977abcace6c0c2f0cf7",
                "cfd_origlastupdate": "2023-08-25 12:14:45",
                "cfd_specific_task_definition": [],
                "comments": "",
                "defaultstatus": "I",
                "detail_universalid": "F9A14AD201985EF5169051F8C6E6DDA0",
                "helptext": "Verify Safety Board contents including First Aid kits, Eyewash Kits, Spill Kits, Ear Protection, etc. (Some sites may or may not have all these items). Verify battery spill kit present (if applicable). Verify kits are in place and have not expired.\nNote expiration dates of Eyewash Kit and First Aid Kit.",
                "isdisabled": "0",
                "isdone": "1",
                "isoptional": "0",
                "meta_createdby": "c2",
                "meta_createddate": "2022-12-31 09:53:45",
                "meta_lastupdateby": "fowlco2",
                "meta_lastupdatedate": "2023-08-25 12:14:45",
                "meta_universalid": "2CFBEA2E2B99E2CCC97F0132D4CE3023",
                "minutes_est": "0",
                "minutes_spent": "0",
                "sortorder": "0",
                "source_universalid": "F19C1DF01405E86873CD9305013ED73D",
                "specifictask": "",
                "specifictask_value": "",
                "status": "NA",
                "statusidstamp": "fowlco2",
                "statusnamestamp": "Fowler, Cody",
                "statustimestamp": "2023-08-25 12:14:40",
                "statusvendor_id": "0",
                "statusvendor_name": "",
                "taskname": "Site Safety Verification & Expiration Dates",
                "task_unid": "2CFBEA2E2B99E2CCC97F0132D4CE3023"
            }
        ]
    }
}

=========================================
SELECT
      b.STATUS_ID AS availablestatuses,
      c.CATEGORY_NAME AS category,
      a.HELP_TEXT AS cfd_helptext_coverted,
      a.COMMENTS AS comments,
      d.STATUS_NAME AS defaultstatus,
      pwd.IS_DONE AS isdone,
      a.IS_OPTIONAL AS isoptional,
      a.META_CREATED_BY AS meta_createdby,
      a.META_CREATED_DATE AS meta_createddate,
      a.META_LAST_UPDATED_BY AS meta_lastupdateby,
      a.META_LAST_UPDATED_DATE AS meta_lastupdatedate,
      a.META_UNIVERSAL_ID AS meta_universalid,
      a.MINUTES_EST AS minutes_est,
      e.SPECIFIC_DATA_DESC AS specifictask,
      e.SPECIFIC_DATA_VALUE AS specifictask_value,
      d.STATUS_NAME AS status,
      a.TASK_NAME AS taskname
    FROM opspm.PM_TASK_LIST_ITEM a
    LEFT JOIN opspm.PM_TEMPLATE_TASK b ON a.TASK_ID = b.TASK_ID
    LEFT JOIN opspm.PM_TASK_CATEGORY c ON a.CATEGORY_ID = c.CATEGORY_ID
    LEFT JOIN opspm.PM_STATUS d ON a.DEFAULT_STATUS_ID = d.STATUS_ID
    LEFT JOIN opspm.PM_SPECIFIC_DATA e ON a.SPECIFIC_DATA_ID = e.SPECIFIC_DATA_ID
    LEFT JOIN opspm.PM_FREQUENCY f ON a.FREQUENCY_ID = f.FREQUENCY_ID
    LEFT JOIN opspm.PM_LOCATION_TASK pw ON pw.TASK_ID = a.TASK_ID
    LEFT JOIN pmd_widget_pm_details pwd ON pwd.PM_UNID = pw.PM_UNID
    LEFT JOIN ops_Pm_data s ON s.FREQUENCY = f.FREQUENCY_NAME
    WHERE s.PM_UNID = :pmHeadderId`
