import { Unit } from "src/DB/Models/Unit/unit.schema";




export class UnitConverter {
    
    static convert(quantity: number, fromUnit: Unit, toUnit: Unit): number {
      if (fromUnit.category !== toUnit.category) {
        throw new Error('لا يمكن التحويل بين وحدات من فئات مختلفة');
      }
  
      const baseQuantity = quantity * fromUnit.conversionFactor;
      const convertedQuantity = baseQuantity / toUnit.conversionFactor;
  
      return convertedQuantity;
    }
  
    static convertToBase(quantity: number, unit: Unit): number {
      return quantity * unit.conversionFactor;
    }
  
    /**
     * تحويل من وحدة أساسية
     */
    static convertFromBase(quantity: number, unit: Unit): number {
      return quantity / unit.conversionFactor;
    }
  }