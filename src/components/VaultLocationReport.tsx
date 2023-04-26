import { Download } from '@mui/icons-material'
import { Box, Button, Typography } from '@mui/material'
import { type ReactElement, useEffect, useState } from 'react'
import { type ListProps, TextField, useDataProvider , useListContext } from 'react-admin'
import ItemsReport from '../resources/items/ItemsReport'
import Printable from './Printable'
import * as constants from '../constants'
import SourceField from './SourceField'
import { DateTime } from 'luxon'

type Props = PartialBy<ListProps, 'children'>

export default function VaultLocationReport(props: Props): ReactElement {
  const [open, setOpen] = useState(false)
  const { selectedIds } = useListContext()

  const [locations, setLocations] = useState<Record<number, ReferenceItem>>()
  const dataProvider = useDataProvider()
  useEffect(() => {
    dataProvider
      .getList<ReferenceItem>(constants.R_VAULT_LOCATION, {
        sort: { field: 'id', order: 'ASC' },
        pagination: { page: 1, perPage: 1000 },
        filter: { id: selectedIds }
      })
      .then(({ data }) => {
        console.log({ data })
        let locations = {}
        data.forEach((location) => {
          locations = { ...locations, [location.id]: location }
        })
        setLocations(locations)
      })
      .catch(console.log)
  }, [selectedIds.length])

  console.log({ selectedIds })

  const handleOpen = (open: boolean) => () => {
    setOpen(open)
  }

  return (
    <>
      <Button
        startIcon={<Download />}
        sx={{ lineHeight: '1.5' }}
        size='small'
        onClick={handleOpen(true)}>
        Asset Report
      </Button>
      <Printable open={open} onClose={handleOpen(false)}>
        <>
          {selectedIds.map((id) => {
            return (
              <Box padding={'20px'} key={id}>
                <Typography variant='h4' textAlign='center' margin='10px'>
                  RCO - Location Muster List
                </Typography>
                <Typography variant='h5' textAlign='center' margin='10px'>
                  100% Muster List for {locations?.[id]?.name}, printed{' '}
                  {DateTime.fromISO(new Date().toISOString()).toFormat(
                    'dd/MMM/yyyy hh:mm'
                  )}{' '}
                  (17 items)
                </Typography>
                <ItemsReport filter={{ vaultLocation: id }} {...props}>
                  <TextField source='item_number' label='Item Number' />
                  <TextField source='mediaType' label='Media type' />
                  <SourceField
                    source='protectiveMarking'
                    reference='protectiveMarking'
                  />
                </ItemsReport>
              </Box>
            )
          })}
        </>
      </Printable>
    </>
  )
}
