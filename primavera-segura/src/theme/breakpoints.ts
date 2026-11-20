export const breakpoints = { sm: 375, md: 431, lg: 768, xl: 1024, xxl: 1440 } as const;
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export function breakpoint_for(width: number): Breakpoint {
  if (width >= breakpoints.xxl) return 'xxl';
  if (width >= breakpoints.xl) return 'xl';
  if (width >= breakpoints.lg) return 'lg';
  if (width >= breakpoints.md) return 'md';
  if (width >= breakpoints.sm) return 'sm';
  return 'xs';
}

export const gutter: Record<Breakpoint, number> = { xs: 16, sm: 16, md: 20, lg: 24, xl: 32, xxl: 40 };
