export const queries = {
  getSwitchPmTemplates: `
    SELECT DISTINCT
    plstt.list_template_id,
    plstt.template_name,
    plstt.template_desc,
    plstt.is_disabled,
    pf.frequency_name
    FROM
    opspm.pm_location_template plt
    JOIN opspm.pm_list_template plstt ON plt.list_template_id = plstt.list_template_id
    JOIN opspm.pm_frequency pf ON plt.frequency_id = pf.frequency_id
    JOIN ops_data_switch ods ON ods.brand = plstt.switch_brand

    WHERE plt.location_type = 'Switch'
    AND plstt.is_disabled = 0
    AND sysdate BETWEEN plstt.START_DATE AND plstt.STOP_DATE 
    AND ods.switch_unid = :switchUnId
    AND (plt.switch_unid = :switchUnId OR plt.switch_unid IS NULL)`
};
