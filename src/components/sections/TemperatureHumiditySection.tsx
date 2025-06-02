import { Card, CardContent, CardHeader, Grid, Typography, Box, Divider, Skeleton } from '@mui/material';
import { Thermometer, Droplets } from 'lucide-react';
import { format } from 'date-fns';
import { DataType } from '../../types';
import ValueDisplay from '../ui/ValueDisplay';

interface TemperatureHumiditySectionProps {
  data: DataType;
  loading: boolean;
  thresholds: {
    temperature: {
      warning: { low: number; high: number };
      critical: { low: number; high: number };
    };
    humidity: {
      warning: { low: number; high: number };
      critical: { low: number; high: number };
    };
  };
}

const TemperatureHumiditySection = ({ 
  data, 
  loading,
  thresholds
}: TemperatureHumiditySectionProps) => {
  
  const getTemperatureStatus = (value: number) => {
    if (value >= thresholds.temperature.critical.high || value <= thresholds.temperature.critical.low) return 'critical';
    if (value >= thresholds.temperature.warning.high || value <= thresholds.temperature.warning.low) return 'warning';
    return 'normal';
  };

  const getHumidityStatus = (value: number) => {
    if (value >= thresholds.humidity.critical.high || value <= thresholds.humidity.critical.low) return 'critical';
    if (value >= thresholds.humidity.warning.high || value <= thresholds.humidity.warning.low) return 'warning';
    return 'normal';
  };

  const formatTime = (timeString: string) => {
    try {
      return format(new Date(timeString), 'HH:mm:ss dd/MM/yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        backgroundImage: 'linear-gradient(to bottom right, rgba(30, 30, 60, 0.4), rgba(30, 30, 60, 0.1))',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      className="card"
    >
      <CardHeader 
        title={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Thermometer size={24} color="#00b0ff" />
            <Typography variant="h5" sx={{ ml: 1, fontWeight: 600 }}>
              Temperature & Humidity
            </Typography>
          </Box>
        } 
        sx={{ pb: 1 }}
      />
      <Divider sx={{ opacity: 0.1 }} />
      <CardContent>
        <Grid container spacing={3}>
          {/* NOC Temperature */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
                NOC Temperature
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} width="100%" />
              ) : (
                <ValueDisplay 
                  value={data.nocTemperature.suhu.toFixed(1)}
                  unit="°C"
                  status={getTemperatureStatus(data.nocTemperature.suhu)}
                  icon={<Thermometer size={20} />}
                  timestamp={formatTime(data.nocTemperature.waktu)}
                  showTrend={true}
                  type="temperature"
                />
              )}
            </Box>
          </Grid>

          {/* UPS Temperature */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
                UPS Temperature
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} width="100%" />
              ) : (
                <ValueDisplay 
                  value={data.upsTemperature.suhu.toFixed(1)}
                  unit="°C"
                  status={getTemperatureStatus(data.upsTemperature.suhu)}
                  icon={<Thermometer size={20} />}
                  timestamp={formatTime(data.upsTemperature.waktu)}
                  showTrend={true}
                  type="temperature"
                />
              )}
            </Box>
          </Grid>

          {/* NOC Humidity */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
                NOC Humidity
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} width="100%" />
              ) : (
                <ValueDisplay 
                  value={data.nocHumidity.kelembapan.toFixed(1)}
                  unit="%"
                  status={getHumidityStatus(data.nocHumidity.kelembapan)}
                  icon={<Droplets size={20} />}
                  timestamp={formatTime(data.nocHumidity.waktu)}
                  showTrend={true}
                  type="humidity"
                />
              )}
            </Box>
          </Grid>

          {/* UPS Humidity */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1, opacity: 0.7 }}>
                UPS Humidity
              </Typography>
              {loading ? (
                <Skeleton variant="rectangular" height={80} width="100%" />
              ) : (
                <ValueDisplay 
                  value={data.upsHumidity.kelembapan.toFixed(1)}
                  unit="%"
                  status={getHumidityStatus(data.upsHumidity.kelembapan)}
                  icon={<Droplets size={20} />}
                  timestamp={formatTime(data.upsHumidity.waktu)}
                  showTrend={true}
                  type="humidity"
                />
              )}
            </Box>
          </Grid>
        </Grid>

        <Box 
          sx={{ 
            mt: 2, 
            p: 1, 
            borderRadius: 1, 
            bgcolor: 'rgba(0, 176, 255, 0.1)', 
            border: '1px solid rgba(0, 176, 255, 0.2)' 
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', color: 'info.light' }}>
            <strong>Temperature Thresholds:</strong> Warning: {thresholds.temperature.warning.low}°C - {thresholds.temperature.warning.high}°C, Critical: {thresholds.temperature.critical.low}°C - {thresholds.temperature.critical.high}°C
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', color: 'info.light' }}>
            <strong>Humidity Thresholds:</strong> Warning: {thresholds.humidity.warning.low}% - {thresholds.humidity.warning.high}%, Critical: {thresholds.humidity.critical.low}% - {thresholds.humidity.critical.high}%
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TemperatureHumiditySection;