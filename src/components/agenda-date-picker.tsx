"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  addMonths,
  dayLabel,
  formatDateList,
  monthBounds,
  monthLabel,
  monthOf,
} from "@/features/agenda/model";
import { addDays, MAX_DATES } from "@/features/agenda/schema";
import styles from "./agenda-form.module.css";

const weekdays = [
  ["D", "Domingo"],
  ["S", "Segunda-feira"],
  ["T", "Terça-feira"],
  ["Q", "Quarta-feira"],
  ["Q", "Quinta-feira"],
  ["S", "Sexta-feira"],
  ["S", "Sábado"],
] as const;

function weeksOf(month: string) {
  const { firstDay, nextFirstDay } = monthBounds(month);
  const cells: (string | null)[] = Array.from(
    { length: new Date(`${firstDay}T12:00:00Z`).getUTCDay() },
    () => null,
  );
  for (let date = firstDay; date < nextFirstDay; date = addDays(date, 1))
    cells.push(date);
  while (cells.length % 7) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7)
    weeks.push(cells.slice(index, index + 7));
  return weeks;
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * Escolha de uma ou várias datas. Cada data vira uma anotação independente.
 * Teclado: setas mudam o dia, Page Up/Down o mês, Enter ou espaço marcam.
 */
export function AgendaDatePicker({
  value,
  onChange,
  initialMonth,
  today,
  error,
}: {
  value: string[];
  onChange: (dates: string[]) => void;
  initialMonth: string;
  today: string;
  error?: string;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [focusDate, setFocusDate] = useState(
    value[0] && monthOf(value[0]) === initialMonth
      ? value[0]
      : monthOf(today) === initialMonth
        ? today
        : `${initialMonth}-01`,
  );
  const [limitReached, setLimitReached] = useState(false);
  const moved = useRef(false);
  const gridRef = useRef<HTMLTableElement>(null);
  const min = addDays(today, -730);
  const max = addDays(today, 400);
  const selected = new Set(value);

  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)
      ?.focus();
  }, [focusDate, month]);

  const toggle = (date: string) => {
    if (selected.has(date)) {
      setLimitReached(false);
      onChange(value.filter((item) => item !== date));
      return;
    }
    if (value.length >= MAX_DATES) {
      setLimitReached(true);
      return;
    }
    onChange([...value, date].sort());
  };

  const go = (date: string) => {
    if (date < min || date > max) return;
    moved.current = true;
    setFocusDate(date);
    if (monthOf(date) !== month) setMonth(monthOf(date));
  };

  const changeMonth = (delta: number) => {
    const next = addMonths(month, delta);
    setMonth(next);
    const day = Math.min(
      Number(focusDate.slice(8, 10)),
      Number(addDays(`${addMonths(next, 1)}-01`, -1).slice(8, 10)),
    );
    setFocusDate(`${next}-${String(day).padStart(2, "0")}`);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const steps: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in steps) {
      event.preventDefault();
      go(addDays(focusDate, steps[event.key]));
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      const target = addMonths(
        monthOf(focusDate),
        event.key === "PageUp" ? -1 : 1,
      );
      const lastDay = addDays(`${addMonths(target, 1)}-01`, -1);
      const day = `${target}-${focusDate.slice(8, 10)}`;
      go(day > lastDay ? lastDay : day);
    }
  };

  const canPrevious = `${month}-01` > min;
  const canNext = addDays(`${addMonths(month, 1)}-01`, -1) < max;
  const describedBy = ["field-dates-hint", error ? "field-dates-error" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.picker}>
      <div
        role="group"
        id="field-dates"
        aria-labelledby="field-dates-label"
        aria-describedby={describedBy}
        data-invalid={error ? "true" : undefined}
        className={styles.pickerGroup}
      >
        <p id="field-dates-label" className={styles.pickerLabel}>
          Datas do plantão
        </p>
        <div className={styles.pickerNav}>
          <IconButton
            label="Mês anterior"
            icon={<ChevronLeft size={20} />}
            onClick={() => changeMonth(-1)}
            disabled={!canPrevious}
            className={styles.pickerNavButton}
          />
          <p className={styles.pickerMonth} aria-live="polite">
            {capitalize(monthLabel(month))}
          </p>
          <IconButton
            label="Próximo mês"
            icon={<ChevronRight size={20} />}
            onClick={() => changeMonth(1)}
            disabled={!canNext}
            className={styles.pickerNavButton}
          />
        </div>
        <table className={styles.pickerGrid} ref={gridRef}>
          <thead>
            <tr>
              {weekdays.map(([short, long]) => (
                <th key={long} scope="col" abbr={long}>
                  {short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeksOf(month).map((week, index) => (
              <tr key={index}>
                {week.map((date, column) =>
                  date ? (
                    <td key={date}>
                      <button
                        type="button"
                        data-date={date}
                        className={styles.pickerDay}
                        aria-pressed={selected.has(date)}
                        aria-current={date === today ? "date" : undefined}
                        aria-label={`${dayLabel(date)} de ${date.slice(0, 4)}${date === today ? ", hoje" : ""}`}
                        tabIndex={date === focusDate ? 0 : -1}
                        disabled={date < min || date > max}
                        onClick={() => {
                          setFocusDate(date);
                          toggle(date);
                        }}
                        onKeyDown={onKeyDown}
                      >
                        {Number(date.slice(8, 10))}
                      </button>
                    </td>
                  ) : (
                    <td key={`blank-${column}`} aria-hidden="true" />
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {value.map((date) => (
        <input key={date} type="hidden" name="dates" value={date} />
      ))}
      <div className={styles.pickerSummary} aria-live="polite">
        <p id="field-dates-hint" className={styles.hint}>
          {value.length
            ? `${value.length === 1 ? "1 data escolhida" : `${value.length} datas escolhidas`}: ${formatDateList(value)}.`
            : "Toque nas datas do plantão. Você pode escolher várias; cada uma vira um plantão na agenda."}
        </p>
        {limitReached ? (
          <p className={styles.hint}>
            Escolha no máximo {MAX_DATES} datas de uma vez.
          </p>
        ) : null}
        {value.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setLimitReached(false);
              onChange([]);
            }}
          >
            Limpar datas
          </Button>
        ) : null}
      </div>
      {error ? (
        <p id="field-dates-error" className={styles.error}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
