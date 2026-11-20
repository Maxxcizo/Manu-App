import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { IncidentForm } from '../src/components/IncidentForm';

const TODAY = new Date('2026-11-06');

describe('IncidentForm (PB-11)', () => {
  test('CT-01 empty form shows errors and saves nothing', async () => {
    const onSubmit = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} today={TODAY} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(screen.getByText('El tipo de incidente es obligatorio.')).toBeTruthy();
    expect(screen.getByText('La gravedad es obligatoria.')).toBeTruthy();
    expect(screen.getByTestId('error-input-longitude')).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('CT-02 location outside the forest is rejected', async () => {
    const onSubmit = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} today={TODAY} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fractura' }));
    await fireEvent.press(screen.getByRole('button', { name: 'alta' }));
    await fireEvent.changeText(screen.getByTestId('input-latitude'), '20.6597');
    await fireEvent.changeText(screen.getByTestId('input-longitude'), '-103.3496');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(screen.getByTestId('error-input-longitude')).toHaveTextContent(/dentro de La Primavera/);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test('CT-03 valid form submits numeric coordinates and confirms', async () => {
    const onSubmit = jest.fn();
    await render(<IncidentForm onSubmit={onSubmit} today={TODAY} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Fractura' }));
    await fireEvent.press(screen.getByRole('button', { name: 'media' }));
    await fireEvent.changeText(screen.getByTestId('input-latitude'), '20.68');
    await fireEvent.changeText(screen.getByTestId('input-longitude'), '-103.55');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'fractura', severity: 'media', latitude: 20.68, longitude: -103.55 }),
    );
    expect(await screen.findByText('Incidente guardado.')).toBeTruthy();
  });

  test('shows a server-side failure instead of claiming success', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('forbidden'));
    await render(<IncidentForm onSubmit={onSubmit} today={TODAY} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Caída' }));
    await fireEvent.press(screen.getByRole('button', { name: 'baja' }));
    await fireEvent.changeText(screen.getByTestId('input-latitude'), '20.68');
    await fireEvent.changeText(screen.getByTestId('input-longitude'), '-103.55');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar incidente' }));
    expect(await screen.findByText('forbidden')).toBeTruthy();
    expect(screen.queryByText('Incidente guardado.')).toBeNull();
  });
});
