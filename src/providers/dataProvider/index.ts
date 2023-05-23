import localForageDataProvider from 'ra-data-local-forage'
import {
  withLifecycleCallbacks,
  type DataProvider,
  type ResourceCallbacks
} from 'react-admin'
import * as constants from '../../constants'
import { trackEvent } from '../../utils/audit'
import localForage from 'localforage'
import loadDefaultData from '../../utils/init-data'
import { extendLifeCycle, type AuditFunctionType } from './dataprovider-utils'
import UserLifeCycle from './resource-callbacks/UserLifeCycle'
import ProjectLifeCycle from './resource-callbacks/ProjectLifeCycle'
import BatchLifeCycle from './resource-callbacks/BatchLifeCycle'
import ItemLifeCycle from './resource-callbacks/ItemLifeCycle'
import { customMethods } from './resource-callbacks/LoanCustomMethods'
import ReferenceItemLifeCycle from './resource-callbacks/ReferenceItemLifeCycle'
import DestructionLifeCycle from './resource-callbacks/DestructionLifeCycle'

export const lifecycleCallbacks = (
  audit: AuditFunctionType,
  provider: DataProvider
): Array<ResourceCallbacks<any>> => {
  return [
    BatchLifeCycle(audit, provider),
    UserLifeCycle(audit),
    ProjectLifeCycle(audit),
    ItemLifeCycle(audit),
    extendLifeCycle(constants.R_PLATFORMS, audit),
    ReferenceItemLifeCycle(audit, constants.R_VAULT_LOCATION),
    ReferenceItemLifeCycle(audit, constants.R_ORGANISATION),
    ReferenceItemLifeCycle(audit, constants.R_PLATFORM_ORIGINATOR),
    ReferenceItemLifeCycle(audit, constants.R_PROTECTIVE_MARKING),
    ReferenceItemLifeCycle(audit, constants.R_MEDIA_TYPE),
    ReferenceItemLifeCycle(audit, constants.R_PROTECTIVE_MARKING_AUTHORITY),
    ReferenceItemLifeCycle(audit, constants.R_DEPARTMENT),
    DestructionLifeCycle(audit)
  ]
}

export const getDataProvider = async (
  loggingEnabled: boolean
): Promise<DataProvider<string>> => {
  const localForageData = await localForage.keys()
  if (localForageData.length === 0) {
    await loadDefaultData()
  }

  const provider = await localForageDataProvider({
    prefixLocalForageKey: constants.LOCAL_STORAGE_DB_KEY,
    loggingEnabled
  })

  const providerWithCustomMethods = { ...provider, ...customMethods(provider) }
  const audit = trackEvent(providerWithCustomMethods)

  return withLifecycleCallbacks(
    providerWithCustomMethods,
    lifecycleCallbacks(audit, providerWithCustomMethods)
  )
}
