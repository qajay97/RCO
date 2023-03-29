import { type DataProvider } from 'react-admin';
import { getToken } from '../providers/authProvider';

export enum AuditType {
	LOGIN = 'login',
	LOGOUT = 'logout',
	CREATE_USER = 'create_user',
	DELETE_USER = 'delete_user',
	EDIT_USER = 'edit_user',
	CREATE_PROJECT = 'create_project',
	DELETE_PROJECT = 'delete_project',
	EDIT_PROJECT = 'edit_project',
}

export const trackEvent =
	(dataProvider: DataProvider) =>
	  async (type: AuditType, activityDetail?: string) => {
	    try {
	      const token = getToken();
	      if (token !== null) {
	        const data = JSON.parse(token);
	        await dataProvider.create<Audit>('audit', {
	          data: {
	            user_id: data.id,
	            activity_type: type,
	            date_time: new Date().toISOString(),
	            activity_detail: activityDetail,
	          },
	        });
	      }
	    } catch (error) {
	      console.log(error);
	    }
	  };
