import {
  type DataProvider,
  type AuthProvider,
  withLifecycleCallbacks
} from 'react-admin'
import localForageDataProvider from 'ra-data-local-forage'
import { encryptedUsers } from '../../../utils/init-data'
import authProvider from '../../authProvider'
import { R_AUDIT, R_BATCHES, R_ITEMS, R_USERS } from '../../../constants'
import { lifecycleCallbacks } from '..'
import { trackEvent } from '../../../utils/audit'
import {
  type ResourceType,
  clear,
  generateDummyBatchForTesting,
  generateItemForTesting
} from './dummy-data'
import { DateTime } from 'luxon'
import { AuditType } from '../../../utils/activity-types'

const TEST_STORAGE_KEY = 'rco-test'
const year: number = 2025
const resources: ResourceType[] = [R_ITEMS, R_AUDIT]

describe('CRUD operations on Item Resource', () => {
  let provider: DataProvider
  let auth: AuthProvider

  beforeAll(async () => {
    const provider = await localForageDataProvider({
      prefixLocalForageKey: TEST_STORAGE_KEY
    })
    for (const user of encryptedUsers) {
      await provider.create<User>(R_USERS, { data: { ...user } })
    }
    auth = authProvider(provider)
    await auth.login({ username: 'ian', password: process.env.PASSWORD })

    // creating batch beacuse item_number is generated from batch
    // in the aftercreate lifeCycle
    await provider.create<Batch>(R_BATCHES, {
      data: generateDummyBatchForTesting({ id: 1 })
    })
  })

  beforeEach(async () => {
    const withOutLifecycleProvider = await localForageDataProvider({
      prefixLocalForageKey: TEST_STORAGE_KEY
    })
    provider = withLifecycleCallbacks(
      withOutLifecycleProvider,
      lifecycleCallbacks(
        trackEvent(withOutLifecycleProvider),
        withOutLifecycleProvider
      )
    )
    const clearLists = clear(provider)
    for (const resource of resources) {
      await clearLists(resource)
    }
  })

  it('should create an item', async () => {
    const itemList = await provider.getList<Item>(R_ITEMS, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })

    expect(itemList.total).toBe(0)

    const createdId = (
      await provider.create<Item>(R_ITEMS, {
        data: generateItemForTesting()
      })
    ).data.id
    expect(createdId).toBeDefined()
    const createdItem = (
      await provider.getOne<Item>(R_ITEMS, { id: createdId })
    ).data
    expect(createdItem).toBeDefined()
    expect(createdId).toEqual(createdItem.id)
  })

  it('should update the item', async () => {
    const createdItem = await provider.create<Item>(R_ITEMS, {
      data: generateItemForTesting()
    })
    const createdId = createdItem.data.id

    await provider.update<Item>(R_ITEMS, {
      id: createdId,
      previousData: createdItem,
      data: {
        mediaType: 'Paper',
        remarks: 'dummy-remarks-1',
        createdAt: DateTime.now().toFormat('yyyy-MM-dd')
      }
    })

    const shouldMatchItem = generateItemForTesting({
      id: createdId,
      remarks: 'dummy-remarks-1',
      mediaType: 'Paper',
      toISO: true
    })

    const expectedResult = (
      await provider.getOne<Item>(R_ITEMS, {
        id: createdId
      })
    ).data

    expect(expectedResult).toMatchObject(shouldMatchItem)
  })

  it('should delete the item', async () => {
    const createdItem = await provider.create<Item>(R_ITEMS, {
      data: generateItemForTesting()
    })

    const listBefore = await provider.getList<Item>(R_ITEMS, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })
    expect(listBefore.total).toBe(1)

    await expect(
      provider.delete<Item>(R_ITEMS, { id: createdItem.data.id })
    ).resolves.toBeTruthy()

    const listAfter = await provider.getList<Item>(R_ITEMS, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })
    expect(listAfter.total).toBe(0)
  })

  it('should test before create', async () => {
    const createdId = (
      await provider.create<Item>(R_ITEMS, {
        data: generateItemForTesting()
      })
    ).data.id

    const fetchedItem = (
      await provider.getOne<Item>(R_ITEMS, { id: createdId })
    ).data

    const shouldMatchItem = generateItemForTesting({
      toISO: true,
      id: createdId
    })
    expect(fetchedItem).toMatchObject(shouldMatchItem)
    expect(fetchedItem.createdAt).toBeDefined()
    expect(fetchedItem.createdBy).toBeDefined()
  })

  it('should test before update', async () => {
    const beforeUpdateList = await provider.getList<Audit>(R_AUDIT, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })
    expect(beforeUpdateList.total).toBe(0)

    const createdItem = await provider.create<Item>(R_ITEMS, {
      data: generateItemForTesting()
    })

    expect(createdItem.data.id).toBeDefined()
    expect(createdItem.data.createdAt).toBeDefined()
    expect(createdItem.data.createdBy).toBeDefined()

    const auditListAfterCreate = await provider.getList<Audit>(R_AUDIT, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })

    expect(auditListAfterCreate.total).toBe(1)
    const firstAuditEntry = auditListAfterCreate.data[0]

    expect(firstAuditEntry.activityType).toEqual(AuditType.CREATE_ITEM)
    expect(firstAuditEntry.activityDetail).toBeDefined()
    expect(firstAuditEntry.data_id).toEqual(createdItem.data.id)
    expect(firstAuditEntry.resource).toEqual(R_ITEMS)

    await provider.update<Item>(R_ITEMS, {
      id: createdItem.data.id,
      previousData: createdItem.data,
      data: {
        id: createdItem.data.id,
        mediaType: 'Paper',
        remarks: 'dummy-remarks-1',
        createdAt: DateTime.now().toFormat('yyyy-MM-dd')
      }
    })

    const auditListAfterUpdate = await provider.getList<Audit>(R_AUDIT, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })

    expect(auditListAfterUpdate.total).toBe(2)
    const secondAuditEntry = auditListAfterUpdate.data[1]
    expect(secondAuditEntry.data_id).toEqual(createdItem.data.id)
    expect(secondAuditEntry.resource).toEqual(R_ITEMS)
    expect(secondAuditEntry.activityType).toEqual(AuditType.EDIT_ITEM)
  })

  it('should test after create', async () => {
    const auditListBeforeCreate = await provider.getList<Audit>(R_AUDIT, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })

    const batchList = (
      await provider.getList<Batch>(R_BATCHES, {
        sort: { field: 'id', order: 'ASC' },
        pagination: { page: 1, perPage: 1 },
        filter: {}
      })
    ).data
    const batch = batchList[0]
    expect(auditListBeforeCreate.total).toBe(0)

    const createdItem = (
      await provider.create<Item>(R_ITEMS, {
        data: generateItemForTesting({ id: 1 })
      })
    ).data
    const createdId = createdItem.id

    const fetchedItem = (
      await provider.getOne<Item>(R_ITEMS, {
        id: createdId
      })
    ).data
    const fetchedId: number = fetchedItem.id
    const fetchedIdInc: number = fetchedId + 1
    const batchId: number = batch.id
    expect(fetchedItem.item_number).toEqual(
      `V0${batchId}/${year}/0${fetchedIdInc}`
    )

    const auditListAfterCreate = await provider.getList<Audit>(R_AUDIT, {
      sort: { field: 'id', order: 'ASC' },
      pagination: { page: 1, perPage: 1000 },
      filter: {}
    })

    expect(auditListAfterCreate.total).toBe(1)
    const firstAuditEntry = auditListAfterCreate.data[0]
    expect(firstAuditEntry.activityType).toEqual(AuditType.CREATE_ITEM)
    expect(firstAuditEntry.resource).toEqual(R_ITEMS)
    expect(firstAuditEntry.data_id).toEqual(fetchedItem.id)
  })
})
