
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
