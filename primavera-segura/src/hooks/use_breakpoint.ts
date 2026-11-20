import { useWindowDimensions } from 'react-native';
import { breakpoint_for, gutter, type Breakpoint } from '../theme';

export interface Layout {
  width: number;
  height: number;
  bp: Breakpoint;
  is_phone: boolean; // < 768: bottom navigation, lists, single column
  is_tablet: boolean; // 768–1023: navigation rail
  is_desktop: boolean; // >= 1024: sidebar, tables, multi-column
  gutter: number;
}

export function layout_for(width: number, height: number): Layout {
  const bp = breakpoint_for(width);
  return {
    width,
    height,
    bp,
    is_phone: width < 768,
    is_tablet: width >= 768 && width < 1024,
    is_desktop: width >= 1024,
    gutter: gutter[bp],
  };
}

export function useBreakpoint(): Layout {
  const { width, height } = useWindowDimensions();
  return layout_for(width, height);
}

export type { Breakpoint };
