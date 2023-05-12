import {
  DatagridConfigurable,
  DateField,
  FilterButton,
  List,
  type ListProps,
  SearchInput,
  SelectColumnsButton,
  TextField,
  TextInput,
  TopToolbar,
  useListContext,
  useRefresh,
  AutocompleteInput,
  type SortPayload,
  useGetList
} from 'react-admin'
import SourceField from '../../components/SourceField'
import SourceInput from '../../components/SourceInput'
import { mediaTypeOptions } from '../../utils/options'
import * as constants from '../../constants'
import CreatedByMeFilter from '../../components/CreatedByMeFilter'
import { ItemAssetReport } from './ItemsReport'
import { Button, Chip, Modal } from '@mui/material'
import React, { useEffect, useState } from 'react'
import FlexBox from '../../components/FlexBox'
import ChangeLocation from './ItemForm/ChangeLocation'
import DateFilter, { ResetDateFilter } from '../../components/DateFilter'
import LoanItemsListBulkActionButtons from './LoanItemsListBulkActionButtons'
import DateRangePicker from '../../components/DateRangePicker'

const sort = (field = 'name'): SortPayload => ({ field, order: 'ASC' })

const omitColumns: string[] = [
  'id',
  'createdAt',
  'remarks',
  'start',
  'end',
  'vaultLocation',
  'musterRemarks',
  'loanedTo'
]

interface Props {
  source: string
  label: string
}

const OnLoanFilter = ({ source, label }: Props): React.ReactElement => {
  const { setFilters, displayedFilters } = useListContext()
  const { data } = useGetList<Item>(constants.R_ITEMS, {
    sort: { field: 'id', order: 'ASC' }
  })
  useEffect(() => {
    if (data !== undefined) {
      const filteredIds = data
        .filter((d) => d.loanedTo !== undefined)
        .map((f) => f.id)
      if (filteredIds.length > 0)
        setFilters(
          {
            ...displayedFilters,
            [source]: filteredIds
          },
          displayedFilters
        )
    }
  }, [data])

  return <Chip sx={{ marginBottom: 1 }} label={label} />
}

const filters = [
  <SearchInput source='q' key='q' alwaysOn placeholder='Reference' />,
  <CreatedByMeFilter
    key='createdByMe'
    source='createdBy_eq'
    label='Created By Me'
  />,
  <SourceInput
    key='createdBy'
    source='createdBy'
    reference={constants.R_USERS}
  />,
  <SourceInput
    key='loanedTo'
    source='loanedTo'
    reference={constants.R_USERS}
  />,
  <TextInput source='item_number' key='item_number' label='Reference' />,
  <AutocompleteInput
    source='mediaType'
    key='mediaType'
    choices={mediaTypeOptions}
  />,
  <DateRangePicker
    startSource='end_gte'
    endSource='start_lte'
    startLabel='Start'
    endLabel='End'
    source='date_range'
    key='date_range'
    label='Date Range'
  />,
  <SourceInput
    source='vaultLocation'
    key='vaultLocation'
    sort={sort()}
    reference='vaultLocation'
  />,
  <SourceInput
    source='protectiveMarking'
    key='protectiveMarking'
    sort={sort()}
    reference='protectiveMarking'
  />,
  <SourceInput
    source='batchId'
    key='batchId'
    sort={sort('batchNumber')}
    reference={constants.R_BATCHES}
    optionField='batchNumber'
  />,
  <TextInput key='remarks' source='remarks' />,
  <DateFilter source='createdAt' label='Created At' key='createdAt' />,
  <OnLoanFilter source='id' label='On loan' key='loaned' />
]

const ItemActions = (): React.ReactElement => {
  return (
    <TopToolbar>
      <ItemAssetReport storeKey='items-asset-report' />
      <FilterButton />
      <SelectColumnsButton />
    </TopToolbar>
  )
}

const checkIfNoneIsLoaned = (
  selectedIds: number[],
  data: Item[]
): [boolean, boolean] => {
  if (selectedIds.length === 0) {
    return [false, false]
  } else {
    const filteredData = data.filter((item) => selectedIds.includes(item.id))
    return [
      filteredData.every((f) => f.loanedTo === undefined),
      filteredData.every((f) => f.loanedTo !== undefined)
    ]
  }
}

export const BulkActions = (): React.ReactElement => {
  const { selectedIds, data } = useListContext()
  const [open, setOpen] = useState(false)
  const refresh = useRefresh()
  const [noneLoaned, setNoneLoaned] = useState(false)
  const [allLoaned, setAllLoaned] = useState(false)

  useEffect(() => {
    const [noneLoanedVal, allLoanedVal] = checkIfNoneIsLoaned(selectedIds, data)
    setNoneLoaned(noneLoanedVal)
    setAllLoaned(allLoanedVal)
  }, [selectedIds, data])

  const handleClose = (): void => {
    setOpen(false)
  }

  const handleOpen = (): void => {
    setOpen(true)
  }

  const handleSuccess = (): void => {
    handleClose()
    refresh()
  }

  return (
    <>
      <FlexBox>
        <Button size='small' variant='outlined' onClick={handleOpen}>
          Change Location
        </Button>
      </FlexBox>
      <LoanItemsListBulkActionButtons
        noneLoaned={noneLoaned}
        allLoaned={allLoaned}
      />
      <Modal open={open} onClose={handleClose}>
        <ChangeLocation
          successCallback={handleSuccess}
          onCancel={handleClose}
          ids={selectedIds}
        />
      </Modal>
    </>
  )
}

export default function ItemList(
  props?: Omit<ListProps, 'children'>
): React.ReactElement {
  return (
    <List
      hasCreate={false}
      actions={<ItemActions />}
      resource={constants.R_ITEMS}
      filters={filters}
      {...props}>
      <ResetDateFilter source='createdAt' />
      {/* <ResetDateRangeFilter source='date_range' /> */}
      <DatagridConfigurable
        rowClick='show'
        bulkActionButtons={<BulkActions />}
        omit={omitColumns}>
        <TextField source='item_number' label='Reference' />
        <TextField source='id' />
        <TextField source='createdAt' label='Created' />
        <TextField source='mediaType' label='Media type' />
        <SourceField
          link='show'
          source='loanedTo'
          reference={constants.R_USERS}
          label='Loaned to'
        />
        <DateField showTime source='start' />
        <DateField showTime source='end' />
        <SourceField source='vaultLocation' reference='vaultLocation' />
        <SourceField source='protectiveMarking' reference='protectiveMarking' />
        <SourceField
          link='show'
          source='batchId'
          reference={constants.R_BATCHES}
          sourceField='batchNumber'
        />
        <TextField source='remarks' />
        <TextField source='musterRemarks' />
      </DatagridConfigurable>
    </List>
  )
}
