import { useMemo } from 'react';
import { Vector3 } from 'three';
import { islandById, route } from '../world/route';
import { chapters } from '../../content/story';
import { SparkHarbour } from './islands/SparkHarbour';
import { ArcadeIsle } from './islands/ArcadeIsle';
import { Academy } from './islands/Academy';
import { Discovery } from './islands/Discovery';
import { EngineHarbour } from './islands/EngineHarbour';

export function Islands() {
  const spark = islandById.spark!;
  const arcade = islandById.arcade!;
  const academy = islandById.academy!;
  const discovery = islandById.discovery!;
  const storm = islandById.storm!;

  const arcadeTowardRoute = useMemo(() => {
    const c = chapters.find((ch) => ch.id === 'arcade')!;
    const p = route.getPointAt((c.range[0] + c.range[1]) / 2);
    return new Vector3().subVectors(p, arcade.position).setY(0).normalize();
  }, [arcade]);

  return (
    <>
      <group position={spark.position}>
        <SparkHarbour radius={spark.radius} />
      </group>
      <group position={arcade.position}>
        <ArcadeIsle radius={arcade.radius} worldPosition={arcade.position} towardRoute={arcadeTowardRoute} />
      </group>
      <group position={academy.position}>
        <Academy radius={academy.radius} />
      </group>
      <group position={discovery.position}>
        <Discovery radius={discovery.radius} />
      </group>
      <group position={storm.position}>
        <EngineHarbour radius={storm.radius} />
      </group>
    </>
  );
}
