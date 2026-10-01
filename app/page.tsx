'use client'

import { useState } from 'react'
import axios from 'axios'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

type Mode = 'inicial' | 'calculador' | 'optimizador'

export default function EasyChargeCalculator() {
  const [mode, setMode] = useState<Mode>('inicial')
  const [equipment, setEquipment] = useState<{ name: string; watts: number }[]>([])
  const [equipmentName, setEquipmentName] = useState('')
  const [equipmentWatts, setEquipmentWatts] = useState('')
  const [recommendation, setRecommendation] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // OPTIMIZADOR STATE
  const [billAmount, setBillAmount] = useState('')
  const [dailyHours, setDailyHours] = useState('')
  const [savingsPercent, setSavingsPercent] = useState('')
  const [savingsRecommendation, setSavingsRecommendation] = useState<any>(null)

  // CALCULADOR: Agregar equipo
  const addEquipment = () => {
    if (!equipmentName || !equipmentWatts) {
      setError('Por favor completa nombre y consumo')
      return
    }
    setEquipment([...equipment, { name: equipmentName, watts: parseInt(equipmentWatts) }])
    setEquipmentName('')
    setEquipmentWatts('')
    setError('')
  }

  // CALCULADOR: Eliminar equipo
  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index))
  }

  // CALCULADOR: Obtener recomendación
  const getRecommendation = async () => {
    if (equipment.length === 0) {
      setError('Agrega al menos un equipo')
      return
    }

    setLoading(true)
    setError('')

    try {
      const totalConsumption = equipment.reduce((sum, eq) => sum + eq.watts, 0)
      const response = await axios.post('/api/recommend', { totalConsumption })
      setRecommendation(response.data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al obtener recomendación')
    } finally {
      setLoading(false)
    }
  }

  // OPTIMIZADOR: Calcular ahorro
  const calculateSavings = async () => {
    if (!billAmount || !dailyHours || !savingsPercent) {
      setError('Por favor completa todos los campos')
      return
    }

    setLoading(true)
    setError('')

    try {
      const bill = parseFloat(billAmount)
      const hours = parseFloat(dailyHours)
      const percent = parseFloat(savingsPercent) / 100

      // Tarifa estimada (necesitamos asumir consumo promedio)
      // Tarifa argentina promedio: ~$50-60/kWh (estimado)
      const estimatedTariff = 50 // $/kWh

      // Consumo actual estimado
      const monthlyConsumption = bill / estimatedTariff // kWh/mes
      const dailyConsumption = monthlyConsumption / 30

      // kWh que necesita generar diariamente
      const kWhToGenerate = dailyConsumption * percent * hours

      // Watts necesarios (asumiendo distribución uniforme en horas)
      const wattsNeeded = (kWhToGenerate * 1000) / hours

      // Obtener recomendación del generador
      const response = await axios.post('/api/recommend', { totalConsumption: wattsNeeded })

      // Calcular ahorros
      const monthlySavings = bill * percent
      const annualSavings = monthlySavings * 12
      const paybackMonths = Math.ceil((response.data.price ? parseFloat(response.data.price.replace(/[^0-9]/g, '')) : 500000) / monthlySavings)

      setSavingsRecommendation({
        ...response.data,
        currentBill: bill,
        savingsPercent: percent * 100,
        monthlySavings,
        annualSavings,
        paybackMonths,
        kWhPerDay: dailyConsumption,
        kWhToGenerate: Math.round(kWhToGenerate),
        wattsNeeded: Math.round(wattsNeeded),
        dailyHours: hours
      })
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al calcular ahorros')
    } finally {
      setLoading(false)
    }
  }

  // Generar PDF
  const generatePDF = async (contentId: string, filename: string) => {
    const element = document.getElementById(contentId)
    if (!element) return

    const canvas = await html2canvas(element, { scale: 2 })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF()
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save(filename)
  }

  // PANTALLA INICIAL
  if (mode === 'inicial') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Easy Charge</h1>
            <p className="text-lg text-gray-600">Soluciones de Energía Personalizada</p>
          </div>

          {/* Pregunta Principal */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">
              ¿Cuál es tu necesidad?
            </h2>

            {/* Opción 1: Calculador */}
            <button
              onClick={() => {
                setMode('calculador')
                setEquipment([])
                setRecommendation(null)
                setError('')
              }}
              className="w-full mb-4 p-6 border-2 border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-500 transition"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-blue-900 mb-2">
                  1️⃣ Cubrir mi consumo
                </h3>
                <p className="text-gray-600">
                  Tengo estos equipos y quiero que funcionen. ¿Qué generador necesito?
                </p>
              </div>
            </button>

            {/* Opción 2: Optimizador */}
            <button
              onClick={() => {
                setMode('optimizador')
                setSavingsRecommendation(null)
                setError('')
              }}
              className="w-full mb-4 p-6 border-2 border-green-300 rounded-lg hover:bg-green-50 hover:border-green-500 transition"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-green-900 mb-2">
                  2️⃣ Reducir mi factura
                </h3>
                <p className="text-gray-600">
                  Mi boleta de luz es cara. ¿Cuánto ahorraría con un generador?
                </p>
              </div>
            </button>

            {/* Opción 3: Paneles (Próximamente) */}
            <button
              disabled
              className="w-full p-6 border-2 border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed opacity-60"
            >
              <div className="text-left">
                <h3 className="text-xl font-bold text-gray-600 mb-2">
                  3️⃣ Solución con paneles (Próximamente)
                </h3>
                <p className="text-gray-500">
                  Quiero funcionar 24/7 con energía 100% renovable
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // PANTALLA CALCULADOR
  if (mode === 'calculador') {
    const totalWatts = equipment.reduce((sum, eq) => sum + eq.watts, 0)

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => {
              setMode('inicial')
              setEquipment([])
              setRecommendation(null)
            }}
            className="mb-4 text-blue-600 hover:text-blue-800 font-semibold"
          >
            ← Volver al inicio
          </button>

          <h1 className="text-3xl font-bold text-blue-900 mb-8">
            Calculador de Generador
          </h1>

          {/* Formulario */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar Equipos</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre del equipo (ej: TV, Heladera)"
                value={equipmentName}
                onChange={(e) => setEquipmentName(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Consumo (W)"
                value={equipmentWatts}
                onChange={(e) => setEquipmentWatts(e.target.value)}
                className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={addEquipment}
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            >
              Agregar Equipo
            </button>
          </div>

          {/* Lista de Equipos */}
          {equipment.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Equipos Agregados</h2>

              <div className="space-y-2">
                {equipment.map((eq, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-gray-50 p-3 rounded"
                  >
                    <span className="font-semibold text-gray-800">
                      {eq.name}: {eq.watts}W
                    </span>
                    <button
                      onClick={() => removeEquipment(idx)}
                      className="text-red-600 hover:text-red-800 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300">
                <p className="text-lg font-bold text-blue-900">
                  Consumo Total: {totalWatts}W
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  💡 Con margen de seguridad: {Math.round(totalWatts * 1.5)}W
                </p>
              </div>

              <button
                onClick={getRecommendation}
                disabled={loading}
                className="w-full mt-4 bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Buscando recomendación...' : 'Obtener Recomendación'}
              </button>
            </div>
          )}

          {/* Recomendación */}
          {recommendation && (
            <div
              id="pdf-calculador"
              className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-300"
            >
              <h2 className="text-2xl font-bold text-green-900 mb-4">✅ Recomendación</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Consumo solicitado</p>
                  <p className="text-2xl font-bold text-blue-900">{totalWatts}W</p>
                </div>

                <div className="bg-green-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Con margen de seguridad (+50%)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {Math.round(totalWatts * 1.5)}W
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">Generador Recomendado</p>
                  <p className="text-2xl font-bold text-purple-900">{recommendation.productName}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Potencia</p>
                  <p className="text-xl font-bold text-yellow-900">{recommendation.power}</p>
                </div>

                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Batería</p>
                  <p className="text-xl font-bold text-orange-900">{recommendation.battery}</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Autonomía</p>
                  <p className="text-xl font-bold text-indigo-900">{recommendation.autonomy}</p>
                </div>

                <div className="bg-red-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Precio</p>
                  <p className="text-xl font-bold text-red-900">{recommendation.price}</p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded">
                <strong>Beneficios:</strong> Este generador cubre con holgura tu consumo actual y te
                permite agregar más equipos sin problemas. Ideal para emergencias y crecimiento futuro.
              </p>

              <p className="text-gray-600 text-sm mb-4">{recommendation.specs}</p>

              <button
                onClick={() => generatePDF('pdf-calculador', 'cotizacion-easy-charge.pdf')}
                className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
              >
                📄 Descargar PDF
              </button>
            </div>
          )}

          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        </div>
      </div>
    )
  }

  // PANTALLA OPTIMIZADOR
  if (mode === 'optimizador') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <button
            onClick={() => {
              setMode('inicial')
              setSavingsRecommendation(null)
            }}
            className="mb-4 text-green-600 hover:text-green-800 font-semibold"
          >
            ← Volver al inicio
          </button>

          <h1 className="text-3xl font-bold text-green-900 mb-8">
            Optimizador de Costos
          </h1>

          {/* Formulario */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Calcula tu Ahorro</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  💰 Boleta de luz actual ($)
                </label>
                <input
                  type="number"
                  placeholder="Ej: 100000"
                  value={billAmount}
                  onChange={(e) => setBillAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  ⏰ Horas/día que funcionaría el generador
                </label>
                <input
                  type="number"
                  placeholder="Ej: 6, 12, 24"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  📊 % de reducción deseada
                </label>
                <input
                  type="number"
                  placeholder="Ej: 30, 50"
                  value={savingsPercent}
                  onChange={(e) => setSavingsPercent(e.target.value)}
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <button
                onClick={calculateSavings}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Calculando...' : 'Calcular Ahorro'}
              </button>
            </div>
          </div>

          {/* Resultado */}
          {savingsRecommendation && (
            <div
              id="pdf-optimizador"
              className="bg-white rounded-lg shadow-lg p-6 mb-6 border-2 border-green-300"
            >
              <h2 className="text-2xl font-bold text-green-900 mb-4">💰 Análisis de Ahorro</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Factura actual</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${savingsRecommendation.currentBill.toLocaleString()}
                  </p>
                </div>

                <div className="bg-red-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Reducción deseada</p>
                  <p className="text-2xl font-bold text-red-900">
                    {savingsRecommendation.savingsPercent.toFixed(0)}%
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">💚 Ahorro mensual</p>
                  <p className="text-3xl font-bold text-green-900">
                    ${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Ahorro anual</p>
                  <p className="text-2xl font-bold text-purple-900">
                    ${savingsRecommendation.annualSavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Payback (meses)</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {savingsRecommendation.paybackMonths} meses
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded md:col-span-2">
                  <p className="text-gray-600 text-sm">Generador recomendado</p>
                  <p className="text-xl font-bold text-indigo-900">
                    {savingsRecommendation.productName}
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">kWh/día necesarios</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {savingsRecommendation.kWhToGenerate} kWh
                  </p>
                </div>

                <div className="bg-teal-50 p-4 rounded">
                  <p className="text-gray-600 text-sm">Potencia recomendada</p>
                  <p className="text-xl font-bold text-teal-900">
                    {savingsRecommendation.wattsNeeded}W
                  </p>
                </div>
              </div>

              <p className="text-gray-700 mb-6 p-4 bg-gray-50 rounded">
                <strong>Conclusión:</strong> Con este generador funcionando{' '}
                {savingsRecommendation.dailyHours} horas/día, ahorrarás{' '}
                <strong>${savingsRecommendation.monthlySavings.toLocaleString('es-AR', { maximumFractionDigits: 0 })}/mes</strong>
                . Tu inversión se amortiza en aproximadamente{' '}
                <strong>{savingsRecommendation.paybackMonths} meses</strong>.
              </p>

              <button
                onClick={() => generatePDF('pdf-optimizador', 'analisis-ahorro-easy-charge.pdf')}
                className="w-full bg-red-600 text-white py-2 rounded font-semibold hover:bg-red-700 transition"
              >
                📄 Descargar PDF
              </button>
            </div>
          )}

          {error && <div className="text-red-600 font-semibold text-center">{error}</div>}
        </div>
      </div>
    )
  }
}
