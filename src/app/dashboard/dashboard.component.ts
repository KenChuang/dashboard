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
  filedImgs = ['blue', 'red', 'green', 'orange', 'coffee', 'pink', 'indigo', 'purple', 'lake', 'yellow'];
  BSUEListImg = 'icon_box';
  filedWidth = 40;
  filedHeight = 40;
  lineColors = [
    "#389de8",
    "#c93d7d",
    "#6bba42",
    "#dd854a",
    "#895a2b",
    "#f784b0",
    "#3c8c8c",
    "#ad78ea",
    "#79e8d3",
    "#f9bf30"
  ];      // default多組顏色 [BS1, BS2, BS3 ,...]
  BSList: FieldBS[] = [];
  BSnameMapFieldBS: Map<string, FieldBS> = new Map();
  BSUEList = [];
  // Energy
  energyData: any;
  energyOptions: any;
  energyTotalPowerColor = '#000000';
  energyColors = [this.totalColor];
  energyMax = 800;
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
  throughputMax = 1500;
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
    // this.startTimer();
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
      const maxAry: number[] = [];
      this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
        maxAry.push(row.UEList.length);
      });
      tdLen = _.max(maxAry) as number;
    }
    this.throughputTDList = [];
    for (let i = 0; i < tdLen; i++) {
      this.throughputTDList[i] = [];
    }

    this.throughputJson.Throughput.BSUEList.forEach((row: any) => {
      const column = row['BSName'];
      const color = this.BSNameMapColor.get(column);
      for (let i = 0; i < tdLen; i++) {
        const UE = row['UEList'][i];
        const label = (UE) ? UE : '';
        this.throughputTDList[i].push({
          label: label,
          color: color as string
        });
      }
      this.throughputUEsOfLable.push({
        column: column,
        color: color
      });
    });
    this.slideBox();
    console.log(this.throughputTDList);
  }

  // 跑馬燈
  slideBox() {
    clearInterval(this.marquee_setInterval);
    const el = document.getElementById('marquee') as any;
    el.scrollTop = 0;
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
      "XMax": 90.0,
      "YMax": 60.33,
      "BSList": [
        {
          "BSName": "BS1",
          "BSLocX": 83.2,
          "BSLocY": 42.8,
          "Status": "ON"
        },
        {
          "BSName": "BS2",
          "BSLocX": 69.3,
          "BSLocY": 54.7,
          "Status": "ON"
        },
        {
          "BSName": "BS3",
          "BSLocX": 25.8,
          "BSLocY": 54.7,
          "Status": "ON"
        },
        {
          "BSName": "BS4",
          "BSLocX": 76.6,
          "BSLocY": 17.0,
          "Status": "ON"
        },
        {
          "BSName": "BS5",
          "BSLocX": 55.8,
          "BSLocY": 49.9,
          "Status": "OFF"
        },
        {
          "BSName": "BS6",
          "BSLocX": 39.1,
          "BSLocY": 36.4,
          "Status": "OFF"
        },
        {
          "BSName": "BS7",
          "BSLocX": 44.0,
          "BSLocY": 7.2,
          "Status": "OFF"
        },
        {
          "BSName": "BS8",
          "BSLocX": 7.0,
          "BSLocY": 38.1,
          "Status": "OFF"
        }
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            {
              "UEName": "UE12",
              "UELocX": 86.4,
              "UELocY": 42.5
            }
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            {
              "UEName": "UE2",
              "UELocX": 59.5,
              "UELocY": 54.8
            },
            {
              "UEName": "UE3",
              "UELocX": 62.7,
              "UELocY": 54.3
            },
            {
              "UEName": "UE4",
              "UELocX": 66.6,
              "UELocY": 55.0
            },
            {
              "UEName": "UE5",
              "UELocX": 47.5,
              "UELocY": 54.7
            },
            {
              "UEName": "UE14",
              "UELocX": 61.5,
              "UELocY": 55.7
            },
            {
              "UEName": "UE15",
              "UELocX": 48.7,
              "UELocY": 56.0
            },
            {
              "UEName": "UE16",
              "UELocX": 64.1,
              "UELocY": 54.4
            },
            {
              "UEName": "UE19",
              "UELocX": 52.2,
              "UELocY": 55.2
            },
            {
              "UEName": "UE21",
              "UELocX": 71.9,
              "UELocY": 55.6
            },
            {
              "UEName": "UE22",
              "UELocX": 72.6,
              "UELocY": 54.7
            },
            {
              "UEName": "UE23",
              "UELocX": 65.3,
              "UELocY": 55.1
            },
            {
              "UEName": "UE29",
              "UELocX": 40.2,
              "UELocY": 53.8
            },
            {
              "UEName": "UE38",
              "UELocX": 42.4,
              "UELocY": 54.0
            },
            {
              "UEName": "UE41",
              "UELocX": 44.9,
              "UELocY": 27.9
            },
            {
              "UEName": "UE42",
              "UELocX": 81.1,
              "UELocY": 39.7
            },
            {
              "UEName": "UE47",
              "UELocX": 50.6,
              "UELocY": 49.7
            },
            {
              "UEName": "UE48",
              "UELocX": 42.3,
              "UELocY": 40.8
            },
            {
              "UEName": "UE49",
              "UELocX": 48.3,
              "UELocY": 36.3
            }
          ]
        },
        {
          "BSName": "BS3",
          "UEList": [
            {
              "UEName": "UE6",
              "UELocX": 27.0,
              "UELocY": 54.6
            },
            {
              "UEName": "UE7",
              "UELocX": 32.4,
              "UELocY": 54.1
            },
            {
              "UEName": "UE8",
              "UELocX": 18.9,
              "UELocY": 54.4
            },
            {
              "UEName": "UE17",
              "UELocX": 20.3,
              "UELocY": 54.0
            },
            {
              "UEName": "UE18",
              "UELocX": 38.6,
              "UELocY": 55.4
            },
            {
              "UEName": "UE20",
              "UELocX": 19.8,
              "UELocY": 56.1
            },
            {
              "UEName": "UE24",
              "UELocX": 23.7,
              "UELocY": 55.4
            },
            {
              "UEName": "UE25",
              "UELocX": 23.7,
              "UELocY": 55.4
            },
            {
              "UEName": "UE26",
              "UELocX": 28.2,
              "UELocY": 55.1
            },
            {
              "UEName": "UE27",
              "UELocX": 33.7,
              "UELocY": 54.7
            },
            {
              "UEName": "UE28",
              "UELocX": 15.4,
              "UELocY": 56.0
            },
            {
              "UEName": "UE33",
              "UELocX": 20.6,
              "UELocY": 55.5
            },
            {
              "UEName": "UE39",
              "UELocX": 17.6,
              "UELocY": 53.8
            },
            {
              "UEName": "UE40",
              "UELocX": 23.7,
              "UELocY": 56.2
            },
            {
              "UEName": "UE43",
              "UELocX": 35.7,
              "UELocY": 39.2
            },
            {
              "UEName": "UE44",
              "UELocX": 17.7,
              "UELocY": 55.2
            },
            {
              "UEName": "UE45",
              "UELocX": 24.3,
              "UELocY": 54.0
            },
            {
              "UEName": "UE46",
              "UELocX": 31.6,
              "UELocY": 55.4
            }
          ]
        },
        {
          "BSName": "BS4",
          "UEList": [
            {
              "UEName": "UE1",
              "UELocX": 81.2,
              "UELocY": 4.7
            },
            {
              "UEName": "UE9",
              "UELocX": 79.1,
              "UELocY": 15.3
            },
            {
              "UEName": "UE10",
              "UELocX": 74.8,
              "UELocY": 8.3
            },
            {
              "UEName": "UE11",
              "UELocX": 76.0,
              "UELocY": 21.6
            },
            {
              "UEName": "UE13",
              "UELocX": 75.1,
              "UELocY": 27.9
            },
            {
              "UEName": "UE30",
              "UELocX": 75.6,
              "UELocY": 19.7
            },
            {
              "UEName": "UE31",
              "UELocX": 76.1,
              "UELocY": 13.3
            },
            {
              "UEName": "UE32",
              "UELocX": 78.2,
              "UELocY": 24.5
            },
            {
              "UEName": "UE34",
              "UELocX": 77.9,
              "UELocY": 6.0
            },
            {
              "UEName": "UE35",
              "UELocX": 75.0,
              "UELocY": 11.9
            },
            {
              "UEName": "UE36",
              "UELocX": 75.7,
              "UELocY": 23.3
            },
            {
              "UEName": "UE37",
              "UELocX": 75.0,
              "UELocY": 9.8
            },
            {
              "UEName": "UE50",
              "UELocX": 26.8,
              "UELocY": 36.4
            }
          ]
        },
        {
          "BSName": "BS5",
          "UEList": []
        },
        {
          "BSName": "BS6",
          "UEList": []
        },
        {
          "BSName": "BS7",
          "UEList": []
        },
        {
          "BSName": "BS8",
          "UEList": []
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
        "StartHour": 13,
        "StartMin": 18,
        "EndHour": 16,
        "EndMin": 50,
        "Interval": 669.4736842105264
      },
      "BSPowerList": [
        {
          "BSName": "BS1",
          "PowerList": [
            162.016,
            176.506,
            176.506,
            160.7,
            192.88,
            164.683,
            172.328,
            163.634,
            161.038,
            160.7,
            165.892,
            161.447,
            183.973,
            161.038,
            162.655,
            161.393,
            183.973,
            162.655,
            174.337,
            178.835,
            161.002,
            170.479,
            161.393,
            161.038,
            161.393,
            170.479,
            160.771,
            161.447,
            160.789,
            0.0,
            161.002,
            176.506,
            161.002,
            161.393
          ]
        },
        {
          "BSName": "BS2",
          "PowerList": [
            174.337,
            174.337,
            163.634,
            161.393,
            160.7,
            160.771,
            167.261,
            161.393,
            165.892,
            160.7,
            0.0,
            183.973,
            163.634,
            160.7,
            162.745,
            186.782,
            162.745,
            165.892,
            183.973,
            162.655,
            168.79,
            162.655,
            178.835,
            164.683,
            0.0,
            161.393,
            176.506,
            162.655,
            189.751,
            162.655
          ]
        },
        {
          "BSName": "BS3",
          "PowerList": [
            160.7,
            183.973,
            160.7,
            189.751,
            167.261,
            161.393,
            165.892,
            163.634,
            162.745,
            178.835,
            161.447,
            165.892,
            192.88,
            160.789,
            160.7,
            160.7,
            160.7,
            174.337,
            160.7,
            160.7,
            160.7,
            160.7,
            160.7,
            160.7,
            160.7,
            196.169,
            160.7,
            160.7,
            160.7,
            160.7
          ]
        },
        {
          "BSName": "BS4",
          "PowerList": [
            162.745,
            199.618,
            170.479,
            160.7,
            160.7,
            160.789,
            160.7,
            160.771,
            160.7,
            167.261,
            162.655,
            160.7,
            167.261,
            161.447,
            160.7,
            174.337,
            181.324,
            160.7,
            178.835,
            167.261,
            172.328,
            160.789,
            162.655,
            181.324,
            189.751,
            160.7,
            161.447,
            160.789,
            196.169,
            162.745
          ]
        },
        {
          "BSName": "BS5",
          "PowerList": [
            174.337,
            160.7,
            167.261,
            161.944,
            196.169,
            161.002,
            161.002,
            196.169,
            168.79,
            186.782,
            161.393,
            160.7,
            162.745,
            186.782,
            186.782,
            174.337,
            161.002,
            178.835,
            174.337,
            161.038,
            199.618,
            192.88,
            183.973,
            178.835,
            163.634,
            183.973,
            161.447,
            160.771,
            186.782
          ]
        },
        {
          "BSName": "BS6",
          "PowerList": [
            162.745,
            160.789,
            161.038,
            161.393,
            161.038,
            0.0,
            160.7,
            0.0,
            186.782,
            161.038,
            162.016,
            174.337,
            176.506,
            163.634,
            161.393,
            162.016,
            167.261,
            162.016,
            161.393,
            161.447,
            161.944,
            160.7,
            181.324,
            196.169,
            163.634,
            174.337,
            178.835,
            161.038,
            199.618
          ]
        },
        {
          "BSName": "BS7",
          "PowerList": [
            165.892,
            181.324,
            168.79,
            160.789,
            196.169,
            0.0,
            0.0,
            0.0,
            0.0,
            167.261,
            160.771,
            0.0,
            196.169,
            186.782,
            181.324,
            181.324,
            161.447,
            163.634,
            160.789,
            196.169,
            0.0,
            161.944,
            192.88,
            178.835,
            163.634,
            161.447,
            186.782,
            176.506,
            0.0
          ]
        },
        {
          "BSName": "BS8",
          "PowerList": [
            0.0,
            189.751,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            164.683,
            0.0,
            0.0,
            0.0,
            170.479,
            0.0,
            0.0,
            0.0,
            0.0,
            161.038,
            162.655,
            0.0,
            0.0,
            161.944,
            161.002,
            0.0,
            0.0,
            0.0,
            162.655
          ]
        }
      ],
      "TotalPowerList": [
        1347.6,
        1156.14,
        1181.01,
        1195.68,
        1400.63,
        1183.45,
        1161.12,
        1189.39,
        1148.17,
        1342.9,
        1178.84,
        1178.48,
        1226.33,
        1227.02,
        1170.17,
        1179.41,
        1187.71,
        1205.94,
        1196.55
      ],
      "BSPowerMax": 1760.0,
      "TotalPowerMax": 33440.0,
      "PowerConsumptionwithoutES": 152000,
      "TodayEnergyConsumption": 23056.539999999997,
      "EnergySaving": 128943.46,
      "EnergySavingRatio": 84.83122368421053
    }
  }
}

function throughputJson() {
  return {
    "Throughput": {
      "TimeRange": {
        "StartHour": 13,
        "StartMin": 18,
        "EndHour": 19,
        "EndMin": 8,
        "Interval": 1050.0
      },
      "BSThrpList": [
        {
          "BSName": "BS1",
          "ThrpList": [
            500.607,
            639.492,
            497.032,
            772.693,
            702.703,
            211.071,
            0.0,
            898.086,
            657.98,
            751.084,
            198.66,
            672.836,
            351.768,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            574.598,
            0.0,
            336.063,
            187.963,
            204.866,
            627.152,
            738.119
          ]
        },
        {
          "BSName": "BS2",
          "ThrpList": [
            485.192,
            147.369,
            455.647,
            202.491,
            209.452,
            434.813,
            211.071,
            793.67,
            751.198,
            127.895,
            0.0,
            206.691,
            418.239,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            0.0,
            535.977,
            336.063,
            187.963,
            204.866,
            627.152,
            738.119
          ]
        },
        {
          "BSName": "BS3",
          "ThrpList": [
            498.177,
            232.844,
            508.074,
            739.668,
            236.952,
            629.304,
            443.879,
            633.71,
            211.071,
            157.237,
            467.27,
            555.593,
            633.618,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            574.598,
            535.977,
            336.063,
            187.963,
            204.866,
            627.152,
            738.119
          ]
        },
        {
          "BSName": "BS4",
          "ThrpList": [
            374.32,
            143.899,
            659.851,
            96.1285,
            217.319,
            685.645,
            377.439,
            705.831,
            577.913,
            268.731,
            739.668,
            0.0,
            470.423,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            574.598,
            535.977,
            336.063,
            187.963,
            204.866,
            627.152,
            738.119
          ]
        },
        {
          "BSName": "BS5",
          "ThrpList": [
            157.736,
            474.51,
            164.227,
            755.073,
            547.729,
            702.066,
            730.129,
            209.976,
            739.668,
            418.995,
            799.963,
            739.668,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            574.598,
            535.977,
            336.063,
            187.963,
            204.866,
            627.152,
            0.0
          ]
        },
        {
          "BSName": "BS6",
          "ThrpList": [
            898.086,
            453.254,
            633.71,
            375.834,
            109.062,
            0.0,
            639.706,
            0.0,
            502.515,
            177.841,
            273.304,
            211.071,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            862.853,
            67.5373,
            206.691,
            574.598,
            535.977,
            336.063,
            187.963,
            204.866,
            627.152,
            0.0
          ]
        },
        {
          "BSName": "BS7",
          "ThrpList": [
            206.929,
            634.53,
            211.071,
            492.076,
            282.987,
            0.0,
            0.0,
            0.0,
            0.0,
            209.352,
            0.0,
            0.0,
            562.037,
            578.668,
            141.705,
            633.71,
            211.071,
            286.937,
            898.086,
            60.9297,
            0.0,
            67.5373,
            206.691,
            574.598,
            535.977,
            336.063,
            187.963,
            204.866,
            0.0,
            0.0
          ]
        },
        {
          "BSName": "BS8",
          "ThrpList": [
            0.0,
            167.375,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            0.0,
            762.468,
            0.0,
            0.0,
            0.0,
            141.705,
            0.0,
            0.0,
            0.0,
            0.0,
            60.9297,
            862.853,
            0.0,
            0.0,
            574.598,
            535.977,
            0.0,
            0.0,
            0.0,
            627.152,
            0.0
          ]
        }
      ],
      "BSThrpMax": 12000.0,
      "TotalThrpMax": 240000.0,
      "TotalThrpList": [
        2873.6,
        2508.39,
        3433.44,
        3066.0,
        2674.94,
        3572.91,
        3009.84,
        2924.95,
        3593.15,
        2985.2,
        2868.0,
        2760.75,
        3534.73,
        2896.72,
        2650.61,
        2998.03,
        2568.97,
        2859.47,
        2941.39,
        2307.69
      ],
      "BSUEList": [
        {
          "BSName": "BS1",
          "UEList": [
            "UE12"
          ]
        },
        {
          "BSName": "BS2",
          "UEList": [
            "UE2",
            "UE3",
            "UE4",
            "UE5",
            "UE14",
            "UE15",
            "UE16",
            "UE19",
            "UE21",
            "UE22",
            "UE23",
            "UE29",
            "UE38",
            "UE41",
            "UE42",
            "UE47",
            "UE48",
            "UE49"
          ]
        },
        {
          "BSName": "BS3",
          "UEList": [
            "UE6",
            "UE7",
            "UE8",
            "UE17",
            "UE18",
            "UE20",
            "UE24",
            "UE25",
            "UE26",
            "UE27",
            "UE28",
            "UE33",
            "UE39",
            "UE40",
            "UE43",
            "UE44",
            "UE45",
            "UE46"
          ]
        },
        {
          "BSName": "BS4",
          "UEList": [
            "UE1",
            "UE9",
            "UE10",
            "UE11",
            "UE13",
            "UE30",
            "UE31",
            "UE32",
            "UE34",
            "UE35",
            "UE36",
            "UE37",
            "UE50"
          ]
        },
        {
          "BSName": "BS5",
          "UEList": []
        },
        {
          "BSName": "BS6",
          "UEList": []
        },
        {
          "BSName": "BS7",
          "UEList": []
        },
        {
          "BSName": "BS8",
          "UEList": []
        }
      ]
    }
  }
}
