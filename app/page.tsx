'use client'

import { useState } from 'react'
import axios from 'axios'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface Equipment {
  name: string
  consumption: number
}

interface Recommendation {
  productName: string
  power: string
  battery: string
  price: string
  autonomy: string
  specs: string
}

export default function EnergyCalculator() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [newEquipmentName, setNewEquipmentName] = useState('')
  const [newEquipmentConsumption, setNewEquipmentConsumption] = useState('')
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [totalConsumption, setTotalConsumption] = useState(0)
  const [loading, setLoading] = useState(false)

  const addEquipment = () => {
    if (newEquipmentName && newEquipmentConsumption) {
      const consumption = parseFloat(newEquipmentConsumption)
      const newEquipment = { name: newEquipmentName, consumption }
      setEquipments([...equipments, newEquipment])
      setTotalConsumption(totalConsumption + consumption)
      setNewEquipmentName('')
      setNewEquipmentConsumption('')
    }
  }

  const removeEquipment = (index: number) => {
    const removed = equipments[index]
    setEquipments(equipments.filter((_, i) => i !== index))
    setTotalConsumption(totalConsumption - removed.consumption)
  }

  const getRecommendation = async () => {
    setLoading(true)
    try {
      const response = await axios.post('/api/recommend', {
        totalConsumption: totalConsumption,
      })
      setRecommendation(response.data)
    } catch (error) {
      console.error('Error getting recommendation:', error)
      alert('Error al obtener recomendación')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    const element = document.getElementById('pdf-content')
    if (!element) return

    const canvas = await html2canvas(element)
    const pdf = new jsPDF()
    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210
    const pageHeight = 295
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save('Easy-Charge-Cotizacion.pdf')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Easy Charge</h1>
          <p className="text-gray-600">Calculadora de Necesidades Energéticas</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Agregar Equipos</h2>

            <div className="flex gap-4 mb-4">
              <input
                type="text"
                placeholder="Nombre del equipo (ej: TV, Heladera)"
                value={newEquipmentName}
                onChange={(e) => setNewEquipmentName(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Consumo (W)"
                value={newEquipmentConsumption}
                onChange={(e) => setNewEquipmentConsumption(e.target.value)}
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addEquipment}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Agregar
              </button>
            </div>

            <div className="space-y-2">
              {equipments.map((eq, idx) => (
                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium text-gray-700">
                    {eq.name}: <span className="text-blue-600">{eq.consumption}W</span>
                  </span>
                  <button
                    onClick={() => removeEquipment(idx)}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-gray-600 text-sm">Consumo Total</p>
            <p className="text-3xl font-bold text-blue-600">{totalConsumption}W</p>
            <p className="text-gray-500 text-xs mt-1">{(totalConsumption / 1000).toFixed(2)}kW</p>
          </div>

          <button
            onClick={getRecommendation}
            disabled={totalConsumption === 0 || loading}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-bold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Buscando recomendación...' : 'Obtener Recomendación'}
          </button>
        </div>

        {recommendation && (
          <div id="pdf-content" className="bg-white rounded-lg shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recomendación Automática</h2>

            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
              <p className="text-gray-600 text-sm mb-2">Generador Recomendado</p>
              <h3 className="text-2xl font-bold text-green-700 mb-4">{recommendation.productName}</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-600 text-sm">Potencia</p>
                  <p className="text-xl font-bold text-gray-800">{recommendation.power}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Batería</p>
                  <p className="text-xl font-bold text-gray-800">{recommendation.battery}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Autonomía Estimada</p>
                  <p className="text-xl font-bold text-gray-800">{recommendation.autonomy}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Precio</p>
                  <p className="text-xl font-bold text-gray-800">{recommendation.price}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-gray-600 text-sm mb-2">Especificaciones</p>
                <p className="text-gray-700">{recommendation.specs}</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-bold text-gray-800 mb-3">Equipos Relevados</h4>
              <div className="space-y-2">
                {equipments.map((eq, idx) => (
                  <div key={idx} className="flex justify-between text-gray-700">
                    <span>{eq.name}</span>
                    <span className="font-semibold">{eq.consumption}W</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                  <span>Total</span>
                  <span className="text-blue-600">{totalConsumption}W</span>
                </div>
              </div>
            </div>

            <button
              onClick={generatePDF}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold"
            >
              Descargar Cotización (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
