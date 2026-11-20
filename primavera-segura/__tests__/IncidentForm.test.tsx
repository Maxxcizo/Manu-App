import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { IncidentForm } from '../src/components/IncidentForm';

// The map is a WebView; the form logic is tested without it (map picking is covered by map_protocol tests).
jest.mock('../src/components/IncidentMap', () => ({ IncidentMap: () => null }));

const TODAY = new Date('2026-11-06');
const METRICS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };
const setup = (onSubmit: jest.Mock) =>
  render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <IncidentForm onSubmit={onSubmit} today={TODAY} />
    </SafeAreaProvider>,
  );

async function fill_location(lat: string, lng: string) {
  await fireEvent.changeText(screen.getByTestId('input-latitude'), lat);
  await fireEvent.changeText(screen.getByTestId('input-longitude'), lng);
}

describe('IncidentForm (PB-11)', () => {
  test('CT-01 empty form shows errors next to each field and saves nothing', async () => {
    const onSubmit = jest.fn();
    await setup(onSubmit);
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(screen.getByText('El tipo de incidente es obligatorio.')).toBeTruthy();
    expect(screen.getByText('La gravedad es obligatoria.')).toBeTruthy();
    expect(screen.getByTestId('error-input-longitude')).toBeTruthy();
    expect(screen.getByText('Revisa los campos marcados.')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('CT-02 location outside the forest is rejected', async () => {
    const onSubmit = jest.fn();
    await setup(onSubmit);
    await fireEvent.press(screen.getByRole('button', { name: 'Fractura' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Alta' }));
    await fill_location('20.6597', '-103.3496');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(screen.getByTestId('error-input-longitude')).toHaveTextContent(/dentro de La Primavera/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('CT-03 valid form submits numeric coordinates and shows the confirmation', async () => {
    const onSubmit = jest.fn();
    await setup(onSubmit);
    await fireEvent.press(screen.getByRole('button', { name: 'Fractura' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Media' }));
    await fill_location('20.68', '-103.55');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: 'fractura', severity: 'media', latitude: 20.68, longitude: -103.55, trail: null }));
    expect(await screen.findByText('Incidente registrado')).toBeTruthy();
  });

  test('"Registrar otro" resets the form; date shortcuts fill the date', async () => {
    const onSubmit = jest.fn();
    await setup(onSubmit);
    await fireEvent.press(screen.getByRole('button', { name: 'Ayer' }));
    expect(screen.getByTestId('input-date').props.value).toBe('2026-11-05');
    await fireEvent.press(screen.getByRole('button', { name: 'Caída' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Baja' }));
    await fill_location('20.68', '-103.55');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Registrar otro' }));
    expect(screen.getByTestId('input-latitude').props.value).toBe('');
    expect(screen.getByTestId('input-date').props.value).toBe('2026-11-06');
  });

  test('shows a server-side failure instead of claiming success', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('forbidden'));
    await setup(onSubmit);
    await fireEvent.press(screen.getByRole('button', { name: 'Caída' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Baja' }));
    await fill_location('20.68', '-103.55');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(await screen.findByText('forbidden')).toBeTruthy();
    expect(screen.queryByText('Incidente registrado')).toBeNull();
  });
});
