import localForageDataProvider from 'ra-data-local-forage'
import {
  withLifecycleCallbacks,
  type DeleteResult,
  type CreateResult,
  type UpdateResult,
  type DataProvider
} from 'react-admin'
import * as constants from '../../constants'
import { AuditType, trackEvent } from '../../utils/audit'
import users from './users'
import { getReferenceData } from './reference-data'
import localForage from 'localforage'
import { encryptData, generateSalt } from '../../utils/encryption'
import { DateTime } from 'luxon'
import {
  generateBatch,
  generateItems,
  generatePlatform,
  generateProject
} from '../../utils/generateData'
import '../../types.d'
import { isNumber } from '../../utils/number'

export const nowDate = (): string => {
  return DateTime.now().toFormat('yyyy-MM-dd')
}

const compareVersions = (v1: string, v2: string): number => {
  const s1 = parseInt(v1.substring(1))
  const s2 = parseInt(v2.substring(1))
  if (s1 < s2) {
    return -1
  } else if (s1 > s2) {
    return 1
  } else {
    return 0
  }
}

export const generateBatchId = async (
  provider: DataProvider,
  year: string
): Promise<string> => {
  if (!isNumber(year)) throw new TypeError('Year invalid')
  const batches = await provider.getList(constants.R_BATCHES, {
    sort: { field: 'id', order: 'ASC' },
    pagination: { page: 1, perPage: 1000 },
    filter: { yearOfReceipt: year }
  })

  if (batches.data.length === 1 || batches.data.length === 0) {
    return batches.data.length.toLocaleString('en-US', {
      minimumIntegerDigits: 2,
      useGrouping: false
    })
  }

  const greatestBatch = batches.data.reduce((prev, current) =>
    compareVersions(prev.batchNumber, current.batchNumber) === -1
      ? current
      : prev
  )

  return (parseInt(greatestBatch.batchNumber.substring(1)) + 1).toLocaleString(
    'en-US',
    {
      minimumIntegerDigits: 2,
      useGrouping: false
    }
  )
}

export const getDataProvider = async (): Promise<DataProvider<string>> => {
  const platforms = generatePlatform(10)
  const projects = generateProject(10)
  const organisation = getReferenceData('Organisation')
  const department = getReferenceData('Department')
  const vaultLocation = getReferenceData('Vault Location')
  const mediaType = getReferenceData('Media')
  const protectiveMarking = getReferenceData('Protective Marking')
  const protectiveMarkingAuthority = getReferenceData(
    'Protective Marking Authority'
  )
  const platformOriginator = getReferenceData('Platform Originator')

  const encryptedUsers = users.map((user) => {
    const salt: string = generateSalt()
    const userPassword: string = user.password
    const updatedUser = {
      ...user,
      salt,
      password: encryptData(`${userPassword}${salt}`)
    }
    return updatedUser
  })

  const batches = generateBatch(
    10,
    platforms.length,
    department.length,
    projects.length,
    organisation.length,
    protectiveMarkingAuthority.length,
    protectiveMarking.length
  )

  const items: Item[] = []
  const numItems = 10
  for (let i = 0; i < batches.length; i++) {
    const project = projects.find(
      (project) => project.id === batches[i].project
    )
    if (project !== undefined) {
      items.push(
        ...generateItems(
          numItems,
          numItems * i,
          batches[i],
          vaultLocation.length,
          protectiveMarking.length,
          project
        )
      )
    }
  }

  const defaultData: RCOStore = {
    users: encryptedUsers,
    batches,
    items,
    platforms,
    projects,
    organisation,
    department,
    vaultLocation,
    mediaType,
    protectiveMarking,
    protectiveMarkingAuthority,
    platformOriginator
  }

  // push all the default data into resources in localForage
  for (const [key, value] of Object.entries(defaultData)) {
    await localForage.setItem(`${constants.LOCAL_STORAGE_DB_KEY}${key}`, value)
  }

  const provider = await localForageDataProvider({
    prefixLocalForageKey: constants.LOCAL_STORAGE_DB_KEY,
    defaultData
  })

  const providerWithCustomMethods = { ...provider }
  const audit = trackEvent(providerWithCustomMethods)

  return withLifecycleCallbacks(providerWithCustomMethods, [
    {
      resource: constants.R_USERS,
      afterDelete: async (record: DeleteResult<User>) => {
        await audit(AuditType.DELETE_USER, `User deleted (${record.data.id})`)
        return record
      },
      afterCreate: async (record: CreateResult<User>) => {
        await audit(AuditType.CREATE_USER, `User created (${record.data.id})`)
        return record
      },
      afterUpdate: async (record: UpdateResult<User>) => {
        await audit(AuditType.EDIT_USER, `User updated (${record.data.id})`)
        return record
      }
    },
    {
      resource: constants.R_PROJECTS,
      afterDelete: async (record: DeleteResult<Project>) => {
        await audit(
          AuditType.DELETE_PROJECT,
          `Project deleted (${String(record.data.id)})`
        )
        return record
      },
      afterCreate: async (
        record: CreateResult<Project>,
        dataProvider: DataProvider
      ) => {
        const { data } = record
        const { id } = data
        await audit(
          AuditType.CREATE_PROJECT,
          `Project created (${String(record.data.id)})`
        )
        await dataProvider.update<Project>(constants.R_PROJECTS, {
          id,
          previousData: data,
          data: { createdAt: nowDate() }
        })
        return record
      },
      afterUpdate: async (record: UpdateResult<Project>) => {
        await audit(
          AuditType.EDIT_PROJECT,
          `Project updated (${String(record.data.id)})`
        )
        return record
      }
    },
    {
      resource: constants.R_BATCHES,
      afterCreate: async (
        record: CreateResult<Batch>,
        dataProvider: DataProvider
      ) => {
        try {
          const { data } = record
          const { id, yearOfReceipt: year } = data
          const yearVal: string = year
          const idVal: string = await generateBatchId(provider, year)
          const batchNumber = `V${idVal}/${yearVal}`
          await dataProvider.update<Batch>(constants.R_BATCHES, {
            id,
            previousData: data,
            data: {
              batchNumber,
              createdAt: nowDate()
            }
          })
          await audit(AuditType.CREATE_BATCH, `Batch created (${String(id)})`)
          return record
        } catch (error) {
          console.log({ error })
          return record
        }
      },
      afterUpdate: async (record: UpdateResult<Batch>) => {
        await audit(
          AuditType.EDIT_BATCH,
          `Batch updated (${String(record.data.id)})`
        )
        return record
      },
      afterDelete: async (record: DeleteResult<Batch>) => {
        await audit(
          AuditType.DELETE_BATCH,
          `Batch deleted (${String(record.data.id)})`
        )
        return record
      }
    },
    {
      resource: constants.R_ITEMS,
      afterCreate: async (
        record: CreateResult<Item>,
        dataProvider: DataProvider
      ) => {
        try {
          const { data } = record
          const { batchId, id } = data
          const { data: batch } = await dataProvider.getOne<Batch>(
            constants.R_BATCHES,
            {
              id: batchId
            }
          )
          const idCtr: number = id
          const idVal: string = (idCtr + 1).toLocaleString('en-US', {
            minimumIntegerDigits: 2,
            useGrouping: false
          })
          const batchNumber: string = batch.batchNumber
          const itemNumber = `${batchNumber}/${idVal}`

          await dataProvider.update<Item>(constants.R_ITEMS, {
            id,
            previousData: data,
            data: {
              item_number: itemNumber,
              createdAt: nowDate()
            }
          })
          await audit(AuditType.CREATE_ITEM, `Item created (${String(id)})`)
          return record
        } catch (error) {
          console.log({ error })
          return record
        }
      },
      afterUpdate: async (record: UpdateResult<Item>) => {
        await audit(
          AuditType.EDIT_ITEM,
          `Item updated (${String(record.data.id)})`
        )
        return record
      },
      afterDelete: async (record: DeleteResult<Item>) => {
        await audit(
          AuditType.DELETE_ITEM,
          `Item deleted (${String(record.data.id)})`
        )
        return record
      }
    }
  ])
}
