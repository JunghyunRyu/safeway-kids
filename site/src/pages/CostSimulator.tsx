/**
 * P3-73: Cost reduction simulator page.
 * Lets prospective academy operators estimate savings from switching to SafeWay Kids.
 */
import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface SimResult {
  currentMonthlyCost: number;
  safewayMonthlyCost: number;
  monthlySaving: number;
  yearlySaving: number;
  savingPercent: number;
}

function simulate(
  vehicleCount: number,
  driverCount: number,
  studentCount: number,
  monthlyFuelPerVehicle: number,
  monthlyInsurancePerVehicle: number,
  monthlySalaryPerDriver: number,
  monthlyMaintenancePerVehicle: number,
): SimResult {
  const currentMonthlyCost =
    vehicleCount * (monthlyFuelPerVehicle + monthlyInsurancePerVehicle + monthlyMaintenancePerVehicle) +
    driverCount * monthlySalaryPerDriver;

  // SafeWay Kids pricing model: per-student monthly fee
  const perStudentFee = 89000; // won per student per month
  const safewayMonthlyCost = studentCount * perStudentFee;

  const monthlySaving = currentMonthlyCost - safewayMonthlyCost;
  const savingPercent = currentMonthlyCost > 0 ? (monthlySaving / currentMonthlyCost) * 100 : 0;

  return {
    currentMonthlyCost,
    safewayMonthlyCost,
    monthlySaving,
    yearlySaving: monthlySaving * 12,
    savingPercent,
  };
}

function formatWon(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(0)}만원`;
  }
  return `${value.toLocaleString()}원`;
}

export default function CostSimulator() {
  const [vehicleCount, setVehicleCount] = useState(2);
  const [driverCount, setDriverCount] = useState(2);
  const [studentCount, setStudentCount] = useState(30);
  const [fuelPerVehicle, setFuelPerVehicle] = useState(800000);
  const [insurancePerVehicle, setInsurancePerVehicle] = useState(200000);
  const [salaryPerDriver, setSalaryPerDriver] = useState(2500000);
  const [maintenancePerVehicle, setMaintenancePerVehicle] = useState(300000);
  const [result, setResult] = useState<SimResult | null>(null);

  const handleSimulate = () => {
    setResult(
      simulate(vehicleCount, driverCount, studentCount, fuelPerVehicle, insurancePerVehicle, salaryPerDriver, maintenancePerVehicle),
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">
              비용 절감 <span className="text-primary">시뮬레이터</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              현재 셔틀버스 운영 비용과 SafeWay Kids 이용 비용을 비교해 보세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold mb-6">현재 운영 현황</h2>

              <div className="space-y-5">
                <InputField label="차량 수" value={vehicleCount} onChange={setVehicleCount} unit="대" min={1} max={20} />
                <InputField label="기사 수" value={driverCount} onChange={setDriverCount} unit="명" min={1} max={20} />
                <InputField label="학생 수" value={studentCount} onChange={setStudentCount} unit="명" min={1} max={200} />
                <InputField label="차량당 월 유류비" value={fuelPerVehicle} onChange={setFuelPerVehicle} unit="원" step={100000} />
                <InputField label="차량당 월 보험료" value={insurancePerVehicle} onChange={setInsurancePerVehicle} unit="원" step={50000} />
                <InputField label="기사 월급" value={salaryPerDriver} onChange={setSalaryPerDriver} unit="원" step={100000} />
                <InputField label="차량당 월 정비비" value={maintenancePerVehicle} onChange={setMaintenancePerVehicle} unit="원" step={50000} />
              </div>

              <button
                onClick={handleSimulate}
                className="mt-8 w-full py-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition text-lg"
              >
                비용 비교하기
              </button>
            </div>

            {/* Result Section */}
            <div>
              {result ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                  <h2 className="text-xl font-bold mb-6">비용 비교 결과</h2>

                  <div className="space-y-4 mb-8">
                    <CostRow label="현재 월 운영비" value={result.currentMonthlyCost} color="text-red-600" />
                    <CostRow label="SafeWay Kids 월 비용" value={result.safewayMonthlyCost} color="text-primary" />
                    <div className="border-t border-gray-200 pt-4">
                      <CostRow
                        label="월 절감액"
                        value={result.monthlySaving}
                        color={result.monthlySaving > 0 ? "text-accent" : "text-red-600"}
                        bold
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-sm text-gray-500 mb-1">연간 절감액</div>
                      <div className={`text-2xl font-extrabold ${result.yearlySaving > 0 ? "text-accent" : "text-red-600"}`}>
                        {formatWon(result.yearlySaving)}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <div className="text-sm text-gray-500 mb-1">절감률</div>
                      <div className={`text-2xl font-extrabold ${result.savingPercent > 0 ? "text-accent" : "text-red-600"}`}>
                        {result.savingPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  {result.monthlySaving > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                      <p className="text-green-700 font-medium">
                        SafeWay Kids로 전환 시 매월 <strong>{formatWon(result.monthlySaving)}</strong>을 절감할 수 있습니다!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                      <p className="text-blue-700 font-medium">
                        학생 수 대비 차량 운영 효율이 높습니다. 안전 관리 부가가치를 고려해 보세요.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-4 text-center">
                    * 시뮬레이션 결과는 참고용이며, 실제 요금은 지역과 계약 조건에 따라 달라질 수 있습니다.
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-12 flex flex-col items-center justify-center h-full">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-400 text-center">
                    현재 운영 현황을 입력하고<br />"비용 비교하기" 버튼을 눌러주세요
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  unit,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none text-sm"
        />
        <span className="text-sm text-gray-500 w-8">{unit}</span>
      </div>
    </div>
  );
}

function CostRow({
  label,
  value,
  color,
  bold,
}: {
  label: string;
  value: number;
  color: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${bold ? "font-bold text-gray-800" : "text-gray-600"}`}>{label}</span>
      <span className={`${bold ? "text-xl font-extrabold" : "text-lg font-bold"} ${color}`}>
        {formatWon(value)}
      </span>
    </div>
  );
}
