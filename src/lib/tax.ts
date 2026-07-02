export type TaxInput = {
  regime: string;
  grossSalary: number;
  businessIncome: number;
  capitalGains: number;
  section80c: number;
  section80d: number;
  hraExemption: number;
  homeLoanInterest: number;
};

export function estimateTax(p: TaxInput) {
  const stdDeduction = 50000;
  const baseIncome = p.grossSalary + p.businessIncome;

  const deductionsOld =
    stdDeduction +
    Math.min(p.section80c, 150000) +
    Math.min(p.section80d, 100000) +
    p.hraExemption +
    Math.min(p.homeLoanInterest, 200000);
  const taxableOld = Math.max(0, baseIncome - deductionsOld);
  const taxableNew = Math.max(0, baseIncome - stdDeduction);

  const slabTaxOld = (income: number) => {
    let inc = income;
    let t = 0;
    if (inc > 1000000) {
      t += (inc - 1000000) * 0.3;
      inc = 1000000;
    }
    if (inc > 500000) {
      t += (inc - 500000) * 0.2;
      inc = 500000;
    }
    if (inc > 250000) {
      t += (inc - 250000) * 0.05;
    }
    return t;
  };

  const slabTaxNew = (inc: number) => {
    const slabs: [number, number][] = [
      [300000, 0],
      [700000, 0.05],
      [1000000, 0.1],
      [1200000, 0.15],
      [1500000, 0.2],
      [Infinity, 0.3],
    ];
    let t = 0;
    let prev = 0;
    for (const [limit, rate] of slabs) {
      if (inc > prev) {
        t += (Math.min(inc, limit) - prev) * rate;
        prev = limit;
      } else break;
    }
    return t;
  };

  let taxOld = slabTaxOld(taxableOld);
  if (taxableOld <= 500000) taxOld = 0;
  let taxNew = slabTaxNew(taxableNew);
  if (taxableNew <= 700000) taxNew = 0;

  const cgTax = Math.max(0, p.capitalGains - 125000) * 0.125;

  taxOld = taxOld * 1.04 + cgTax;
  taxNew = taxNew * 1.04 + cgTax;

  return {
    taxableOld,
    taxableNew,
    taxOld: Math.round(taxOld),
    taxNew: Math.round(taxNew),
    cgTax: Math.round(cgTax),
    recommended: taxOld <= taxNew ? "old" : "new",
    selected: p.regime,
    selectedTax: Math.round(p.regime === "old" ? taxOld : taxNew),
  };
}
