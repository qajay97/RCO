import { type ReactElement } from 'react'
import {
  ReferenceInput,
  type ReferenceInputProps,
  AutocompleteInput,
  type AutocompleteInputProps
} from 'react-admin'

interface Props<T> {
  optionField?: keyof T
  inputProps?: AutocompleteInputProps
}

export default function SourceInput<T extends Record<string, any>>(
  props: Props<T> & ReferenceInputProps
): ReactElement {
  const { optionField = 'name', inputProps = {}, ...rest } = props

  const optionText = (item: T): string => item[optionField] as string

  return (
    <ReferenceInput {...rest}>
      <AutocompleteInput
        sx={{ width: '100%' }}
        optionText={optionText}
        {...inputProps}
      />
    </ReferenceInput>
  )
}
