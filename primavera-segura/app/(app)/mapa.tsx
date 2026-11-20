import React, { useMemo, useState } from 'react';
import { IncidentMap } from '../../src/components/IncidentMap';
import { SyntheticBanner } from '../../src/components/SyntheticBanner';
import { Card, Chip, Muted, Row, Screen } from '../../src/components/ui';
import { useApp } from '../../src/data/app_context';
import { critical_zones } from '../../src/lib/zones';

export default function Mapa() {
  const { incidents } = useApp();
  const [show_incidents, set_incidents] = useState(true);
  const [show_zones, set_zones] = useState(false);
  const zones = useMemo(() => critical_zones(incidents), [incidents]);
  return (
    <Screen title="Mapa" subtitle="Incidentes por gravedad: verde baja, amarillo media, rojo alta">
      <SyntheticBanner />
      <Row>
        <Chip label="Incidentes" active={show_incidents} onPress={() => set_incidents((v) => !v)} />
        <Chip label="Zonas críticas" active={show_zones} onPress={() => set_zones((v) => !v)} />
      </Row>
      <IncidentMap incidents={incidents} zones={zones} show_incidents={show_incidents} show_zones={show_zones} height={480} />
      <Card>
        <Muted>El recuadro punteado verde marca el límite aproximado del bosque. Toca un punto para ver su detalle.</Muted>
      </Card>
    </Screen>
  );
}
