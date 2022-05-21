import { Component, OnInit, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as _ from 'lodash';

interface FieldBS {
  BSName: string;
  BSLocX: number;
  BSLocY: number;
  Status: string;
  imgUrl: string;
  orgBSLocX: number;
  orgBSLocY: number;
}

interface UE {
  label: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  fieldJson: any;

  energyJson: any;

  throughputJson: any;

  refreshTime: string = '';
  defaultMinTime = 30 / 60;  // 分鐘
  fill = false;
  tension = .4;
  totalColor = '#1d70de';  // Energy、throughput total color
  // Filed
  enlarge = 50;
  filedImgs = ['green', 'red', 'yellow'];
  BSUEListImg = 'icon_box';
  filedWidth = 20;
  filedHeight = 20;
  lineColors = [
    "#389de8",
    "#c93d7d",
    "#6bba42",
    "#dd854a",
    "#f9bf30",
    "#f784b0",
    "#895a2b",
    "#3c8c8c",
    "#ad78ea",
    "#79e8d3"
  ];      // default多組顏色 [BS1, BS2, BS3 ,...]
  BSList: FieldBS[] = [];
  BSnameMapFieldBS: Map<string, FieldBS> = new Map();
  BSUEList = [];
  // Energy
  energyData: any;
  energyOptions: any;
  energyTotalPowerColor = '#000000';
  energyColors = [this.totalColor];
  energyMax = 0;
  energyMin = 0;
  energyYScale = [];
  powerConsumptionwithoutES: any;
  todayEnergyConsumption: any;
  energySaving: any;
  energySavingRatio: any;
  // throughput
  throughputData: any;
  throughputOptions: any;
  throughputColors = [this.totalColor];
  throughputMax = 0;
  throughputMin = 0;
  throughputYScale = [];
  throughputUEsOfLable: any[] = [];
  throughputTDList: any[] = [];
  BSNameMapColor: Map<string, string> = new Map();
  marquee_setInterval: any;

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.resizeFieldArea();
  }

  constructor(private http: HttpClient) {
    this.energyColors = _.concat(this.energyColors, this.lineColors);
    this.throughputColors = _.concat(this.throughputColors, this.lineColors);
  }

  ngOnInit(): void {
    this.initData();
    this.startTimer();
  }

  // 計時器
  startTimer() {
    let totalSecond = this.defaultMinTime * 60;
    this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
    let acc = 0;
    const interval = setInterval(() => {
      acc++;
      totalSecond--;
      this.refreshTime = `${addZero(Math.floor(totalSecond / 60))}: ${addZero(totalSecond % 60)}`;
      if (acc === this.defaultMinTime * 60) {
        clearInterval(interval);
        this.startTimer();
        this.initData();
      }
    }, 1000);
  }

  initData() {
    // field
    this.getField();
    // energy
    this.getEnergyJson();
    // throughput
    this.getThroughputJson();
  }

  getField() {
    // const url = 'http://211.20.94.210:8080/field';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getField:');
    //     console.log(res);
    //     this.fieldJson = res;
    //     this.fieldDataSetting();
    //   }
    // );

    /* local file test */
    this.fieldJson = fieldJson();
    this.fieldDataSetting();
  }

  getEnergyJson() {
    // const url = 'http://211.20.94.210:8080/energy';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getEnergyJson:');
    //     console.log(res);
    //     this.energyJson = res;
    //     this.energyDataSetting();
    //   }
    // );

    /* local file test */
    this.energyJson = energyJson();
    this.energyDataSetting();
  }

  getThroughputJson() {
    // const url = 'http://211.20.94.210:8080/throughput';
    // this.http.get(url).subscribe(
    //   res => {
    //     console.log('getThroughputJson:');
    //     console.log(res);
    //     this.throughputJson = res;
    //     this.throughputDataSetting();
    //   }
    // );

    /* local file test */
    this.throughputJson = throughputJson();
    this.throughputDataSetting();
  }

  fieldDataSetting() {
    this.BSnameMapFieldBS = new Map();
    this.BSList = this.fieldJson.Field.BSList;
    this.BSUEList = this.fieldJson.Field.BSUEList;
    this.BSList.forEach((row, idx: number) => {
      row.imgUrl = `assets/img/${this.filedImgs[idx]}.svg`;
      row['orgBSLocX'] = _.cloneDeep(row.BSLocX);
      row['orgBSLocY'] = _.cloneDeep(row.BSLocY);
      this.BSnameMapFieldBS.set(row.BSName, row)
    });
    this.BSUEList.forEach((row: any, idx: number) => {
      const BSname = row['BSName'];
      const fieldBS = this.BSnameMapFieldBS.get(BSname);
      row.UEList.forEach((child: any) => {
        child['color'] = this.lineColors[idx];
        child['imgUrl'] = `assets/img/${this.BSUEListImg}.svg`;
        child['BSLocX'] = fieldBS?.BSLocX;
        child['BSLocY'] = fieldBS?.BSLocY;
        child['orgBSLocX'] = _.cloneDeep(fieldBS?.BSLocX);
        child['orgBSLocY'] = _.cloneDeep(fieldBS?.BSLocY);
        child['orgUELocX'] = _.cloneDeep(child['UELocX']);
        child['orgUELocY'] = _.cloneDeep(child['UELocY']);
      });
    });
    this.resizeFieldArea();
  }

  // Auto Resize Field
  resizeFieldArea() {
    const fieldWidth = (document.getElementsByClassName('map')[0] as any).offsetWidth;
    const fieldHeight = (document.getElementsByClassName('map')[0] as any).offsetHeight;
    const _w = fieldWidth / this.fieldJson.Field.XMax;
    const _h = fieldHeight / this.fieldJson.Field.YMax;
    this.BSList.forEach((row: FieldBS) => {
      row['BSLocX'] = row.orgBSLocX * _w;
      row['BSLocY'] = row.orgBSLocY * _h;
    });
    this.BSUEList.forEach((row: any) => {
      row.UEList.forEach((child: any) => {
        child['BSLocX'] = child['orgBSLocX'] * _w;
        child['BSLocY'] = child['orgBSLocY'] * _h;
        child['UELocX'] = child['orgUELocX'] * _w;
        child['UELocY'] = child['orgUELocY'] * _h;
      });
    });
  }

  energyDataSetting() {
    this.powerConsumptionwithoutES = this.energyJson.Energy.PowerConsumptionwithoutES;
    this.energyMax = this.energyJson.Energy.TotalPowerMax;
    const startHour = Number(this.energyJson.Energy.TimeRange.StartHour);
    const startMin = Number(this.energyJson.Energy.TimeRange.StartMin);
    const endHour = Number(this.energyJson.Energy.TimeRange.EndHour);
    const endMin = Number(this.energyJson.Energy.TimeRange.EndMin);
    const interval = Number(this.energyJson.Energy.TimeRange.Interval);
    const endTotalSecond = (endHour * 60 + endMin) * 60;
    const startTotalSecond = (startHour * 60 + startMin) * 60;
    const startTotalMin = startHour * 60 + startMin;
    const rangeIdx = (endTotalSecond - startTotalSecond) / interval;
    const labels = [];
    const datasets = [];
    const powerConsumptionList = [];
    for (let i = 0; i < rangeIdx + 1; i++) {
      if (i === 0) {
        labels.push(`${startHour}:${addZero(startMin)}`);
      } else if (i === rangeIdx) {
        labels.push(`${endHour}:${addZero(endMin)}`);
      } else {
        const newTotalMin = startTotalMin + ((interval / 60) * i);
        const newHour = Math.floor(newTotalMin / 60);
        const newMin = Math.floor(newTotalMin % 60);
        labels.push(`${newHour}:${addZero(newMin)}`);
      }

      if (i === 0) {
        powerConsumptionList.push(null);
      } else {
        powerConsumptionList.push(this.powerConsumptionwithoutES);
      }
    }

    datasets[0] = {
      label: 'Power Consumption(without ES)',
      data: powerConsumptionList,
      fill: this.fill,
      borderColor: this.energyTotalPowerColor,
      tension: this.tension
    };
    datasets[1] = {
      label: 'Total Power Consumption',
      data: _.concat([null], this.energyJson.Energy.TotalPowerList),
      fill: this.fill,
      borderColor: this.energyColors[0],
      tension: this.tension
    };
    this.energyJson.Energy.BSPowerList.forEach((row: any, idx: number) => {
      datasets.push({
        label: row['BSName'],
        data: _.concat([null], row['PowerList']),
        fill: this.fill,
        borderColor: this.energyColors[idx + 1],
        tension: this.tension
      });
    });
    this.energyData = {
      labels: labels,
      datasets: datasets
    };
    this.energyOptions = this.getEnergyOptions();
    this.todayEnergyConsumption = this.energyJson.Energy.TodayEnergyConsumption;
    this.energySaving = this.energyJson.Energy.EnergySaving;
    this.energySavingRatio = this.energyJson.Energy.EnergySavingRatio;
  }

  throughputDataSetting() {
    this.BSNameMapColor = new Map();
    this.throughputMax = this.throughputJson.Throughput.BSThrpMax;
    const startHour = Number(this.throughputJson.Throughput.TimeRange.StartHour);
    const startMin = Number(this.throughputJson.Throughput.TimeRange.StartMin);
    const endHour = Number(this.throughputJson.Throughput.TimeRange.EndHour);
    const endMin = Number(this.throughputJson.Throughput.TimeRange.EndMin);
    const interval = Number(this.throughputJson.Throughput.TimeRange.Interval);
    const endTotalSecond = (endHour * 60 + endMin) * 60;
    const startTotalSecond = (startHour * 60 + startMin) * 60;
    const startTotalMin = startHour * 60 + startMin;
    const rangeIdx = (endTotalSecond - startTotalSecond) / interval;
    const labels = [];
    const datasets = [];
    for (let i = 0; i < rangeIdx + 1; i++) {
      if (i === 0) {
        labels.push(`${startHour}:${addZero(startMin)}`);
      } else if (i === rangeIdx) {
        labels.push(`${endHour}:${addZero(endMin)}`);
      } else {
        const newTotalMin = startTotalMin + ((interval / 60) * i);
        const newHour = Math.floor(newTotalMin / 60);
        const newMin = Math.floor(newTotalMin % 60);
        labels.push(`${newHour}:${addZero(newMin)}`);
      }
    }
    datasets[0] = {
      label: 'Total Throughput',
      data: _.concat([null], this.throughputJson.Throughput.TotalThrpList),
      fill: this.fill,
      borderColor: this.throughputColors[0],
      tension: this.tension
    };
    this.throughputJson.Throughput.BSThrpList.forEach((row: any, idx: number) => {
      const label = row['BSName'];
      const color = this.throughputColors[idx + 1];
      this.BSNameMapColor.set(label, color)
      datasets.push({
        label: label,
        data: _.concat([null], row['ThrpList']),
        fill: this.fill,
        borderColor: color,
        tension: this.tension
      });
    });
    this.throughputData = {
      labels: labels,
      datasets: datasets
    };
    this.throughputOptions = this.getThroughputOptions();

    this.throughputTDList = [];
    this.throughputUEsOfLable = [];
    // 2X2 Array
    let tdLen: number = 0;
    if (this.throughputJson.Throughput.BSUEList.length > 0) {
      tdLen = this.throughputJson.Throughput.BSUEList[0]['UEList'].length;
    }
    this.throughputTDList = [];
    for (let i = 0; i < tdLen; i++) {
      this.throughputTDList[i] = [];
    }

    this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
      const column = row['BSName'];
      const color = this.BSNameMapColor.get(column);
      row['UEList'].forEach((UE: string, idx: number) => {
        this.throughputTDList[idx].push({
          label: UE,
          color: color as string
        });
      });
      this.throughputUEsOfLable.push({
        column: column,
        color: color
      });
    });
    this.slideBox();
    // console.log(this.throughputUEsOfLable);
    // console.log(this.throughputTDList);
  }

  // 跑馬燈
  slideBox() {
    clearInterval(this.marquee_setInterval);
    const el = document.getElementById('marquee') as any;
    let start: number = 0;
    let end: number = 0;
    this.marquee_setInterval = setInterval(() => {
      if (start <= 30) {
        start++;
      } else {
        el.scrollTop += 1;
        if (el.scrollHeight - el.scrollTop === el.clientHeight) {
          if (end <= 30) {
            end++;
          } else {
            el.scrollTop = 0;
            start = 0;
            end = 0;
          }
        }
      }
    }, 100);
  }

  getEnergyOptions(): object {
    const rangeMapTrue: Map<number, boolean> = new Map();
    const interval = 10;
    const total = this.energyMax - this.energyMin;
    const range = total / interval;
    for (let i = 0; i < interval + 1; i++) {
      rangeMapTrue.set(Math.floor(this.energyMin + range * i), true);
    }
    const max = this.energyMax + Math.floor(range);
    return {
      plugins: {
        legend: {
          // position: 'right',
          // display:false,
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          }
        },
        title: {
          display: false,
          text: 'Energy Consumption',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            stepSize: range,
            callback: (value: any) => {
              if (rangeMapTrue.get(value)) {
                return value;
              } else {
                return '';
              }
            }
          },
          title: {
            display: true,
            text: 'Power(W)',
          },
          grid: {
            color: '#ebedef'
          },
          max: max,
          min: this.energyMin
        }
      }
    };
  }

  getThroughputOptions(): object {
    return {
      plugins: {
        legend: {
          labels: {
            color: '#495057',
            usePointStyle: true,
            pointStyle: 'line',
          }
        },
        title: {
          display: false,
          text: 'Taffic Load',
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#495057',
          },
          title: {
            display: true,
            text: 'Time',
          },
          grid: {
            color: '#ebedef'
          }
        },
        y: {
          ticks: {
            color: '#495057',
            // callback: (value: any) => {
            //   if (value === this.powerConsumptionwithoutES + 10) {
            //     return '';
            //   } else {
            //     return value;
            //   }
            // }
          },
          title: {
            display: true,
            text: 'Throughput(Mbps)',
          },
          grid: {
            color: '#ebedef'
          },
          max: this.throughputMax,
          min: this.throughputMin,
          // offset: true
        }
      }
    };
  }

  getYScale(min: number, max: number): Map<number, boolean> {
    const rangeMapTrue: Map<number, boolean> = new Map();
    const interval = 10;
    const total = max - min;
    const range = total / interval;
    for (let i = 0; i < interval + 1; i++) {
      rangeMapTrue.set(Math.floor(min + range * i), true);
    }
    return rangeMapTrue;
  }
}

function addZero(num: number): string {
  const numStr = num.toString();
  if (numStr.length === 1) {
    return `0${numStr}`;
  } else {
    return numStr;
  }
}

function fieldJson() {
  return {
    "Field": {
      "XMax": 40,
      "YMax": 40,
      "BSList": [
        {
          "BSName": "BS1",
          "BSLocX": 10,
          "BSLocY": 10,
          "Status": "ON"
        },
        {
          "BSName": "BS2",
          "BSLocX": 20,
          "BSLocY": 10,
          "Status": "ON"
        }
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            {
              "UEName": "UE1",
              "UELocX": 5,
              "UELocY": 5
            },
            {
              "UEName": "UE2",
              "UELocX": 10,
              "UELocY": 12
            }
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            {
              "UEName": "UE3",
              "UELocX": 20,
              "UELocY": 25
            },
            {
              "UEName": "UE4",
              "UELocX": 18,
              "UELocY": 27
            }
          ]
        }
      ]
    }
  }
}

// function fieldJson() {
//   return {
//     "Field":
//     {
//       "XMax": 40,
//       "YMax": 40,
//       "BSList":
//         [
//           {
//             "BSname": "BS1", "BSLocX": 100, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS2", "BSLocX": 200, "BSLocY": 100, "Status": "ON"
//           },
//           {
//             "BSname": "BS3", "BSLocX": 300, "BSLocY": 100, "Status": "OFF"
//           }
//         ],
//       "BSUEList":
//         [
//           {
//             "BSname": "BS1",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE1", "UELocX": 100, "UELocY": 4.3
//                 },
//                 {
//                   "UEName": "UE2", "UELocX": 130, "UELocY": 4.2
//                 },
//                 {
//                   "UEName": "UE3", "UELocX": 160, "UELocY": 4.5
//                 }
//               ]
//           },
//           {
//             "BSname": "BS2",
//             "UEList":
//               [
//                 {
//                   "UEName": "UE4", "UELocX": 200, "UELocY": 4.8
//                 },
//                 {
//                   "UEName": "UE5", "UELocX": 230, "UELocY": 6.2
//                 },
//                 {
//                   "UEName": "UE6", "UELocX": 260, "UELocY": 6.5
//                 }
//               ]
//           }
//         ]
//     }

//   }
// }

function energyJson() {
  return {
    "Energy": {
      "TimeRange": {
        "StartHour": 7,
        "StartMin": 30,
        "EndHour": 8,
        "EndMin": 30,
        "Interval": 1200.0
      },
      "BSPowerList": [
        {
          "BSName": "BS1",
          "PowerList": [
            5566.0,
            4000.0,
            5000.0
          ]
        },
        {
          "BSName": "BS2",
          "PowerList": [
            6677.0,
            5000.0,
            5000.0
          ]
        }
      ],
      "TotalPowerList": [
        1234.0,
        9000.0,
        10000.0
      ],
      "BSPowerMax": 8000.0,
      "TotalPowerMax": 24000.0,
      "PowerConsumptionwithoutES": 24000,
      "TodayEnergyConsumption": 20234.0,
      "EnergySaving": 3766.0,
      "EnergySavingRatio": 15.691666666666668
    }

  }
}

function throughputJson() {
  return {
    "Throughput": {
      "TimeRange": {
        "StartHour": 7,
        "StartMin": 30,
        "EndHour": 8,
        "EndMin": 30,
        "Interval": 1200.0
      },
      "BSThrpList": [
        {
          "BSName": "BS1",
          "ThrpList": [
            1234.0,
            1212.0,
            2367.0
          ]
        },
        {
          "BSName": "BS2",
          "ThrpList": [
            2345.0,
            3456.0,
            4567.0
          ]
        }
      ],
      "BSThrpMax": 6000.0,
      "TotalThrpMax": 18000.0,
      "TotalThrpList": [
        3579.0,
        3668.0,
        3934.0
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            "UE1",
            "UE2"
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            "UE3",
            "UE4"
          ]
        }
      ]
    }

  }
}
