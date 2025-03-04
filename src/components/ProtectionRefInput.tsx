import {
  Chip,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  type SelectChangeEvent,
  type SelectProps,
  Typography
} from '@mui/material'
import { useEffect, useState, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'
import useRefTable from '../hooks/useRefTable'
import {
  type RaRecord,
  useGetList,
  useRecordContext,
  useResourceContext
} from 'react-admin'
import { Box } from '@mui/system'

interface Props<T, RefTable> {
  reference: string
  refTable: string
  source: keyof RefTable
  itemId?: number
  label: string
  labelField: keyof T
  width: string
  setIsDirty: (source: string, value: number | number[]) => void
}

type SelectedIdType = number | number[]

export default function ProtectionRefInput<
  T extends RaRecord,
  RefTable extends RaRecord
>(props: SelectProps & Props<T, RefTable>): React.ReactElement {
  const {
    reference,
    source,
    itemId: id,
    refTable,
    label,
    multiple,
    labelField,
    width = '100%',
    setIsDirty,
    ...rest
  } = props
  const [data, setData] = useState<number[] | number>([])
  const record = useRecordContext()
  const resource = useResourceContext()
  const {
    formState: { isSubmitted, isSubmitting, errors },
    setValue
  } = useFormContext()

  const { createRecord, updateRecord } = useRefTable(
    refTable,
    source as string,
    resource
  )

  const { data: options = [] } = useGetList<T>(reference)

  const labelById = useMemo(() => {
    const results: Record<number, T> = {}
    options.forEach((option) => {
      results[option.id as number] = option
    })
    return results
  }, [options])

  const { data: selectedItems = [] } = useGetList<RefTable>(refTable, {
    filter: {
      [resource]: record?.id
    }
  })

  const handleChange = (ev: SelectChangeEvent<typeof data>): void => {
    const value = ev.target.value as SelectedIdType
    setData(value)
    setValue(source as string, value)
    setIsDirty(source as string, value)
  }

  useEffect(() => {
    const selectedData = multiple
      ? selectedItems?.map((item: RefTable) => item[source]) ?? []
      : selectedItems?.[0]?.[source]
    setData(selectedData)
  }, [selectedItems])

  useEffect(() => {
    if (isSubmitted) {
      const selectedData = typeof data === 'number' ? [data] : data
      if (record?.id) {
        updateRecord(record.id as number, selectedData)
      } else if (id) {
        createRecord(id, selectedData)
      }
    }
  }, [isSubmitted, isSubmitting])

  const getLabelById = (id: number): string | undefined =>
    labelById[id]?.[labelField]

  const error: string = (errors[source as string]?.message as string) ?? ''

  const RenderValue = ({
    selected
  }: {
    selected: SelectedIdType
  }): React.ReactElement => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.5
        }}>
        {typeof selected !== 'number' ? (
          selected.map((value: number) => (
            <Chip key={value} label={getLabelById(value)} />
          ))
        ) : (
          <Typography key={selected}>{getLabelById(selected)}</Typography>
        )}
      </Box>
    )
  }

  return (
    <FormControl
      variant='filled'
      sx={{ width, padding: 0 }}
      error={Boolean(error)}>
      <InputLabel id={rest.id}>{label}</InputLabel>
      <Select<typeof data>
        {...rest}
        defaultValue={rest.defaultValue as typeof data}
        multiple={multiple}
        value={data}
        onChange={handleChange}
        renderValue={(selected) => <RenderValue selected={selected} />}>
        {options.map((item: T) => {
          const { id } = item
          return (
            <MenuItem key={id} value={id}>
              {item[labelField]}
            </MenuItem>
          )
        })}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}
