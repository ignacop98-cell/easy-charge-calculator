import { NextRequest, NextResponse } from 'next/server'

const SECCO_PRODUCTS = [
  {
    id: 1,
    name: 'Inversor Solar 3kW + Batería Litio 3.6kWh',
    power: '3000W',
    battery: '3.6kWh',
    price: '$35,000',
    autonomy: '1-2 horas',
    minPower: 0,
    maxPower: 3000,
    specs: 'Potencia: 3kW | Batería: 3.6kWh | Voltaje: 51.2V 70Ah | Certificaciones: IEC 62619'
  },
  {
    id: 2,
    name: 'Inversor Solar 4kW + Batería Litio 4.6kWh',
    power: '4000W',
    battery: '4.6kWh',
    price: '$45,000',
    autonomy: '2-3 horas',
    minPower: 2001,
    maxPower: 4000,
    specs: 'Potencia: 4kW | Batería: 4.6kWh | Voltaje: 51.2V 90Ah | Certificaciones: IEC 62619, IEC 62109-1'
  },
  {
    id: 3,
    name: 'Inversor Solar 5kW + Batería Litio 5.12kWh',
    power: '5000W',
    battery: '5.12kWh',
    price: '$55,000',
    autonomy: '3-4 horas',
    minPower: 4001,
    maxPower: 5000,
    specs: 'Potencia: 5kW | Batería: 5.12kWh | Voltaje: 51.2V 100Ah | Certificaciones: IEC 62619, IEC 62109-1'
  },
  {
    id: 4,
    name: 'Inversor Solar 6kW + Batería Litio 6.14kWh',
    power: '6000W',
    battery: '6.14kWh',
    price: '$65,000',
    autonomy: '4-5 horas',
    minPower: 5001,
    maxPower: 6000,
    specs: 'Potencia: 6kW | Batería: 6.14kWh | Voltaje: 51.2V 120Ah | Certificaciones: IEC 62619, IEC 62109-1'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalConsumption } = body

    if (!totalConsumption || totalConsumption <= 0) {
      return NextResponse.json(
        { error: 'Consumo total inválido' },
        { status: 400 }
      )
    }

    const requiredPower = totalConsumption * 1.2

    const recommendation = SECCO_PRODUCTS.find(
      product => requiredPower <= product.maxPower
    )

    if (!recommendation) {
      return NextResponse.json(
        {
          error: 'No hay producto disponible para ese consumo',
          suggestion: 'Considera reducir el consumo o contacta con Easy Charge'
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      productName: recommendation.name,
      power: recommendation.power,
      battery: recommendation.battery,
      price: recommendation.price,
      autonomy: recommendation.autonomy,
      specs: recommendation.specs,
      requiredPower: Math.round(requiredPower),
      message: `✅ Este producto cubre tus necesidades (${Math.round(requiredPower)}W requeridos)`
    })
  } catch (error) {
    console.error('Error in recommendation API:', error)
    return NextResponse.json(
      { error: 'Error al procesar la recomendación' },
      { status: 500 }
    )
  }
}
