import React from 'react';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  chartData: any[];
}

export default function CommerceAmountChart({ chartData }: Props) {
  if (chartData.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">Montants facturés par année</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">Total et montants facturés</p>
      </div>

      {chartData.every((d: any) => d.total === 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-bold text-amber-900">
            ⚠️ Pas de montants définis pour ces dossiers
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Les montants des articles ne sont pas configurés ou les tarifs sont en erreur (ERREUR_TARIF).
            Veuillez vérifier la configuration des tarifs.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        {/* Legend */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs font-bold text-slate-700">Facturé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span className="text-xs font-bold text-slate-700">Non facturé</span>
          </div>
        </div>

        {/* Chart */}
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(year) => `'${String(year).slice(-2)}`}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  const notBilled = (data.amount || 0) - (data.billed || 0);
                  return (
                    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg">
                      <p className="text-xs font-bold text-slate-900">Année {data.year}</p>
                      <p className="text-xs text-green-700 font-bold">
                        ✓ Facturé: {(data.billed || 0).toFixed(2)}€
                      </p>
                      <p className="text-xs text-amber-700 font-bold">
                        ✗ Non facturé: {notBilled.toFixed(2)}€
                      </p>
                      <p className="text-xs font-bold text-slate-900 mt-1">
                        Total: {(data.amount || 0).toFixed(2)}€
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {data.billedPercentage}% facturé
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="billed" stackId="amount" fill="#22c55e" name="Facturé" radius={[8, 8, 0, 0]} />
            <Bar dataKey="notBilled" stackId="amount" fill="#fbbf24" name="Non facturé" radius={[8, 8, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {chartData.map((item, idx) => (
            <div key={idx} className="text-xs space-y-1">
              <p className="font-bold text-slate-900">'{String(item.year).slice(-2)}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-slate-600">Facturé: {(item.billed || 0).toFixed(0)}€</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-slate-600">Non: {(item.notBilled || 0).toFixed(0)}€</span>
              </div>
              <p className="text-xs text-slate-500 font-bold">{item.billedPercentage}% facturé</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
