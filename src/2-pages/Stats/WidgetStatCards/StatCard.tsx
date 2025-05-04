import React, { useRef, useState, useEffect } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { Tooltip } from '6-shared/ui/Tooltip'

type StatCardProps = {
  title: string | React.ReactNode
  value: string
  shortValue: string
  color?: string
  tooltip?: React.ReactNode
}

const styles = {
  cardContent: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    justifyContent: 'center',
    p: 2
  },
  value: {
    wordBreak: 'break-word' as const,
    fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
  },
  valueWrapper: {
    whiteSpace: 'nowrap' as const
  }
}

export const StatCard = React.memo(
  function StatCard({title, value, shortValue, color, tooltip}: StatCardProps) {
    const [shouldTruncate, setShouldTruncate] = useState(false)
    const fullValueRef = useRef<HTMLSpanElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const fullValue = String(value)
    const truncatedValue = shortValue

    useEffect(() => {

      const checkOverflow = () => {
        if (fullValueRef.current && containerRef.current) {
          const fullValueWidth = fullValueRef.current.offsetWidth
          const containerWidth = containerRef.current.offsetWidth
          // Account for padding (16px on each side)
          const availableWidth = containerWidth - 32
          const needsTruncation = fullValueWidth > availableWidth

          setShouldTruncate(needsTruncation)
        }
      }

      checkOverflow()
      const handleResize = () => checkOverflow()
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }, [value])

    const content = (
      <Paper sx={{height: '100%'}}>
        <Box sx={styles.cardContent} ref={containerRef}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="h4"
            component="div"
            sx={{...styles.value, color: color || 'inherit'}}
          >
            <span
              style={{
                ...styles.valueWrapper,
                position: 'absolute',
                visibility: 'hidden',
                pointerEvents: 'none'
              }}
              ref={fullValueRef}
            >
              {fullValue}
            </span>

            <span style={styles.valueWrapper}>
              {shouldTruncate ? truncatedValue : fullValue}
            </span>
          </Typography>
        </Box>
      </Paper>
    )

    return tooltip ? (<Tooltip title={tooltip} arrow>{content}</Tooltip>) : content
  })
