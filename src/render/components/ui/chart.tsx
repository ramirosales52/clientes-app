import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@render/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; color?: string }>;

function ChartContainer({
  config,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { config: ChartConfig }) {
  const cssVars = Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => value.color)
      .map(([key, value]) => [`--color-${key}`, value.color])
  ) as React.CSSProperties;

  return (
    <div
      style={cssVars}
      className={cn(
        "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-surface]:outline-none",
        className
      )}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer>{children as React.ReactElement}</RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  labelFormatter,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; color?: string; value?: unknown; name?: unknown }>;
  label?: React.ReactNode;
  className?: string;
  indicator?: "dot" | "line" | "dashed";
  hideLabel?: boolean;
  labelFormatter?: (label: React.ReactNode) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className={cn("rounded-lg border bg-popover px-3 py-2 text-sm shadow-md", className)}>
      {!hideLabel && label ? (
        <div className="mb-1 text-xs text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((item, index) => (
          <div key={`${String(item.dataKey ?? item.name ?? "item")}-${index}`} className="flex items-center gap-2">
            <span
              className={cn(
                "inline-block shrink-0 rounded-full",
                indicator === "line" && "h-0.5 w-3 rounded-none",
                indicator === "dashed" && "h-0.5 w-3 rounded-none border-t border-dashed",
                indicator === "dot" && "size-2"
              )}
              style={{ backgroundColor: item.color ?? "var(--chart-1)" }}
            />
            <span className="text-muted-foreground">{String(item.name ?? item.dataKey ?? "")}</span>
            <span className="ml-auto font-medium tabular-nums">
              {typeof item.value === "number" ? item.value.toLocaleString("es-AR") : String(item.value ?? "")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChartLegendContent({
  payload,
  className,
}: {
  payload?: Array<{ dataKey?: string | number; color?: string; value?: unknown; name?: unknown }>;
  className?: string;
}) {
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      {payload.map((item, index) => (
        <div key={`${String(item.dataKey ?? item.name ?? "legend")}-${index}`} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full" style={{ backgroundColor: item.color ?? "var(--chart-1)" }} />
          <span>{String(item.name ?? item.value ?? item.dataKey ?? "")}</span>
        </div>
      ))}
    </div>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartLegend = RechartsPrimitive.Legend;

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };
